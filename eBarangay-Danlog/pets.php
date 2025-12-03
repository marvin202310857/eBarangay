<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_pets();
        break;
    case 'POST':
        register_pet();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_pets() {
    global $conn;

    $sql = "SELECT p.*, CONCAT(r.first_name, ' ', r.last_name) as owner_name
            FROM pets p
            LEFT JOIN residents r ON p.owner_id = r.resident_id
            WHERE p.status = 'active'
            ORDER BY p.registration_date DESC";

    $result = $conn->query($sql);
    $pets = [];

    while ($row = $result->fetch_assoc()) {
        $pets[] = $row;
    }

    json_response(true, 'Pets retrieved successfully', $pets);
}

function register_pet() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $owner_name = sanitize_input($input['ownerName'] ?? '');
    $pet_name = sanitize_input($input['petName'] ?? '');
    $species = sanitize_input($input['species'] ?? '');
    $breed = sanitize_input($input['breed'] ?? '');
    $age = intval($input['age'] ?? 0);
    $gender = sanitize_input($input['gender'] ?? '');
    $color = sanitize_input($input['color'] ?? '');
    $vaccination = sanitize_input($input['vaccination'] ?? 'none');

    // Get owner_id
    $name_parts = explode(' ', $owner_name);
    $first_name = $name_parts[0] ?? '';
    $last_name = $name_parts[count($name_parts) - 1] ?? '';

    $owner_sql = "SELECT resident_id FROM residents WHERE first_name LIKE ? AND last_name LIKE ? LIMIT 1";
    $owner_stmt = $conn->prepare($owner_sql);
    $owner_stmt->bind_param('ss', $first_name, $last_name);
    $owner_stmt->execute();
    $owner_result = $owner_stmt->get_result();

    if ($owner_result->num_rows === 0) {
        json_response(false, 'Owner not found');
    }

    $owner = $owner_result->fetch_assoc();
    $owner_id = $owner['resident_id'];

    $pet_number = generate_id('PET');

    $sql = "INSERT INTO pets (pet_number, owner_id, pet_name, species, breed, age, gender,
            color_markings, vaccination_status, registration_date, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURDATE(), 'active')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('sisssiss', $pet_number, $owner_id, $pet_name, $species, $breed,
                     $age, $gender, $color, $vaccination);

    if ($stmt->execute()) {
        json_response(true, 'Pet registered successfully', ['pet_number' => $pet_number]);
    } else {
        json_response(false, 'Failed to register pet: ' . $conn->error);
    }
}
?>
