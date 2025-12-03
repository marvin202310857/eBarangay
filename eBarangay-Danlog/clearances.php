<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_clearances();
        break;
    case 'POST':
        issue_clearance();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_clearances() {
    global $conn;

    $type = sanitize_input($_GET['type'] ?? '');
    $status = sanitize_input($_GET['status'] ?? 'active');

    $sql = "SELECT c.*, CONCAT(r.first_name, ' ', r.last_name) as resident_name,
            CONCAT(u.first_name, ' ', u.last_name) as issued_by_name
            FROM clearances c
            LEFT JOIN residents r ON c.resident_id = r.resident_id
            LEFT JOIN users u ON c.issued_by = u.user_id
            WHERE c.status = ?";

    $params = [$status];
    $types = 's';

    if (!empty($type)) {
        $sql .= " AND c.clearance_type = ?";
        $params[] = $type;
        $types .= 's';
    }

    $sql .= " ORDER BY c.issued_date DESC";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $clearances = [];
    while ($row = $result->fetch_assoc()) {
        $clearances[] = $row;
    }

    json_response(true, 'Clearances retrieved successfully', $clearances);
}

function issue_clearance() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $resident_name = sanitize_input($input['residentName'] ?? '');
    $clearance_type = sanitize_input($input['certificateType'] ?? '');
    $purpose = sanitize_input($input['purpose'] ?? '');
    $or_number = sanitize_input($input['orNumber'] ?? '');
    $amount = floatval($input['amount'] ?? 0);
    $issued_by = 1; // Default admin user

    // Get resident_id from name
    $name_parts = explode(' ', $resident_name);
    $first_name = $name_parts[0] ?? '';
    $last_name = $name_parts[count($name_parts) - 1] ?? '';

    $resident_sql = "SELECT resident_id FROM residents WHERE first_name LIKE ? AND last_name LIKE ? LIMIT 1";
    $resident_stmt = $conn->prepare($resident_sql);
    $resident_stmt->bind_param('ss', $first_name, $last_name);
    $resident_stmt->execute();
    $resident_result = $resident_stmt->get_result();

    if ($resident_result->num_rows === 0) {
        json_response(false, 'Resident not found');
    }

    $resident = $resident_result->fetch_assoc();
    $resident_id = $resident['resident_id'];

    // Generate certificate number
    $cert_prefix = match($clearance_type) {
        'clearance' => 'BC',
        'residency' => 'CR',
        'indigency' => 'CI',
        default => 'BC'
    };
    $certificate_number = generate_id($cert_prefix);

    // Calculate validity
    $valid_months = $clearance_type === 'indigency' ? 6 : 12;

    $sql = "INSERT INTO clearances (certificate_number, resident_id, clearance_type, purpose, 
            or_number, amount_paid, issued_by, issued_date, valid_until, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL $valid_months MONTH), 'active')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sisssdi', $certificate_number, $resident_id, $clearance_type, 
                     $purpose, $or_number, $amount, $issued_by);

    if ($stmt->execute()) {
        json_response(true, 'Clearance issued successfully', ['certificate_number' => $certificate_number]);
    } else {
        json_response(false, 'Failed to issue clearance: ' . $conn->error);
    }
}
?>
