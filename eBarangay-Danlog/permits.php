<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_permits();
        break;
    case 'POST':
        add_permit();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_permits() {
    global $conn;

    $sql = "SELECT p.*, CONCAT(r.first_name, ' ', r.last_name) as owner_full_name
            FROM business_permits p
            LEFT JOIN residents r ON p.owner_id = r.resident_id
            ORDER BY p.issued_date DESC";

    $result = $conn->query($sql);
    $permits = [];

    while ($row = $result->fetch_assoc()) {
        $permits[] = $row;
    }

    json_response(true, 'Business permits retrieved successfully', $permits);
}

function add_permit() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $business_name = sanitize_input($input['businessName'] ?? '');
    $business_type = sanitize_input($input['businessType'] ?? '');
    $owner_name = sanitize_input($input['ownerName'] ?? '');
    $owner_contact = sanitize_input($input['ownerContact'] ?? '');
    $owner_email = sanitize_input($input['ownerEmail'] ?? '');
    $business_address = sanitize_input($input['businessAddress'] ?? '');
    $permit_type = sanitize_input($input['permitType'] ?? 'new');

    // Get owner_id from residents
    $name_parts = explode(' ', $owner_name);
    $first_name = $name_parts[0] ?? '';
    $last_name = $name_parts[count($name_parts) - 1] ?? '';

    $owner_sql = "SELECT resident_id FROM residents WHERE first_name LIKE ? AND last_name LIKE ? LIMIT 1";
    $owner_stmt = $conn->prepare($owner_sql);
    $owner_stmt->bind_param('ss', $first_name, $last_name);
    $owner_stmt->execute();
    $owner_result = $owner_stmt->get_result();

    $owner_id = 0;
    if ($owner_result->num_rows > 0) {
        $owner = $owner_result->fetch_assoc();
        $owner_id = $owner['resident_id'];
    }

    $permit_number = generate_id('BP');
    $issued_by = 1;

    $sql = "INSERT INTO business_permits (permit_number, business_name, business_type, owner_id, 
            owner_name, owner_contact, owner_email, business_address, permit_type, issued_by, 
            issued_date, expiry_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), DATE_ADD(CURDATE(), INTERVAL 1 YEAR), 'active')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssississi', $permit_number, $business_name, $business_type, $owner_id,
                     $owner_name, $owner_contact, $owner_email, $business_address, $permit_type, $issued_by);

    if ($stmt->execute()) {
        json_response(true, 'Business permit issued successfully', ['permit_number' => $permit_number]);
    } else {
        json_response(false, 'Failed to issue permit: ' . $conn->error);
    }
}
?>
