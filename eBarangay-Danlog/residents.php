<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_residents();
        break;
    case 'POST':
        add_resident();
        break;
    case 'PUT':
        update_resident();
        break;
    case 'DELETE':
        delete_resident();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_residents() {
    global $conn;

    $search = sanitize_input($_GET['search'] ?? '');
    $purok = sanitize_input($_GET['purok'] ?? '');
    $status = sanitize_input($_GET['status'] ?? 'active');

    $sql = "SELECT * FROM residents WHERE status = ?";
    $params = [$status];
    $types = 's';

    if (!empty($search)) {
        $sql .= " AND (first_name LIKE ? OR last_name LIKE ? OR contact_number LIKE ?)";
        $search_term = "%$search%";
        $params[] = $search_term;
        $params[] = $search_term;
        $params[] = $search_term;
        $types .= 'sss';
    }

    if (!empty($purok)) {
        $sql .= " AND purok = ?";
        $params[] = $purok;
        $types .= 's';
    }

    $sql .= " ORDER BY last_name, first_name";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);
    $stmt->execute();
    $result = $stmt->get_result();

    $residents = [];
    while ($row = $result->fetch_assoc()) {
        $residents[] = $row;
    }

    json_response(true, 'Residents retrieved successfully', $residents);
}

function add_resident() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $first_name = sanitize_input($input['firstName'] ?? '');
    $middle_name = sanitize_input($input['middleName'] ?? '');
    $last_name = sanitize_input($input['lastName'] ?? '');
    $birth_date = sanitize_input($input['birthDate'] ?? '');
    $gender = sanitize_input($input['gender'] ?? '');
    $civil_status = sanitize_input($input['civilStatus'] ?? '');
    $contact = sanitize_input($input['contactNumber'] ?? '');
    $email = sanitize_input($input['email'] ?? '');
    $address = sanitize_input($input['address'] ?? '');
    $purok = sanitize_input($input['purok'] ?? '');
    $occupation = sanitize_input($input['occupation'] ?? '');
    $is_voter = isset($input['voterStatus']) && $input['voterStatus'] === 'registered' ? 1 : 0;
    $is_pwd = isset($input['pwdStatus']) && $input['pwdStatus'] === 'yes' ? 1 : 0;
    $is_senior = isset($input['seniorCitizen']) && $input['seniorCitizen'] === 'yes' ? 1 : 0;

    if (empty($first_name) || empty($last_name) || empty($birth_date) || empty($gender)) {
        json_response(false, 'Please provide all required fields');
    }

    $sql = "INSERT INTO residents (first_name, middle_name, last_name, birth_date, gender, civil_status, 
            contact_number, email, address, purok, occupation, is_voter, is_pwd, is_senior, registration_date, status) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sssssssssssiii', 
        $first_name, $middle_name, $last_name, $birth_date, $gender, $civil_status,
        $contact, $email, $address, $purok, $occupation, $is_voter, $is_pwd, $is_senior
    );

    if ($stmt->execute()) {
        $resident_id = $conn->insert_id;

        // Create user account if email provided
        if (!empty($email)) {
            $username = strtolower($first_name . $last_name);
            $password = 'password123'; // Default password
            $password_hash = hash_password($password);

            $user_sql = "INSERT INTO users (username, email, password_hash, role, first_name, last_name, status) 
                        VALUES (?, ?, ?, 'resident', ?, ?, 'active')";
            $user_stmt = $conn->prepare($user_sql);
            $user_stmt->bind_param('sssss', $username, $email, $password_hash, $first_name, $last_name);
            $user_stmt->execute();
        }

        json_response(true, 'Resident added successfully', ['resident_id' => $resident_id]);
    } else {
        json_response(false, 'Failed to add resident: ' . $conn->error);
    }
}

function update_resident() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);
    $resident_id = intval($input['resident_id'] ?? 0);

    if ($resident_id === 0) {
        json_response(false, 'Invalid resident ID');
    }

    // Build update query dynamically based on provided fields
    $fields = [];
    $params = [];
    $types = '';

    $allowed_fields = ['first_name', 'middle_name', 'last_name', 'contact_number', 'email', 
                       'address', 'purok', 'occupation', 'status'];

    foreach ($allowed_fields as $field) {
        if (isset($input[$field])) {
            $fields[] = "$field = ?";
            $params[] = sanitize_input($input[$field]);
            $types .= 's';
        }
    }

    if (empty($fields)) {
        json_response(false, 'No fields to update');
    }

    $params[] = $resident_id;
    $types .= 'i';

    $sql = "UPDATE residents SET " . implode(', ', $fields) . " WHERE resident_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$params);

    if ($stmt->execute()) {
        json_response(true, 'Resident updated successfully');
    } else {
        json_response(false, 'Failed to update resident');
    }
}

function delete_resident() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);
    $resident_id = intval($input['resident_id'] ?? 0);

    if ($resident_id === 0) {
        json_response(false, 'Invalid resident ID');
    }

    // Soft delete by setting status to inactive
    $sql = "UPDATE residents SET status = 'inactive' WHERE resident_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('i', $resident_id);

    if ($stmt->execute()) {
        json_response(true, 'Resident deleted successfully');
    } else {
        json_response(false, 'Failed to delete resident');
    }
}
?>
