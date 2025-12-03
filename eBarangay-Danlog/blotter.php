<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_blotters();
        break;
    case 'POST':
        file_blotter();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_blotters() {
    global $conn;

    $sql = "SELECT * FROM blotter_reports ORDER BY incident_date DESC";
    $result = $conn->query($sql);

    $blotters = [];
    while ($row = $result->fetch_assoc()) {
        $blotters[] = $row;
    }

    json_response(true, 'Blotter reports retrieved successfully', $blotters);
}

function file_blotter() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $reporter_name = sanitize_input($input['reporterName'] ?? '');
    $reporter_contact = sanitize_input($input['reporterContact'] ?? '');
    $reporter_address = sanitize_input($input['reporterAddress'] ?? '');
    $incident_type = sanitize_input($input['incidentType'] ?? '');
    $incident_description = sanitize_input($input['description'] ?? '');
    $incident_date = sanitize_input($input['incidentDate'] ?? '');
    $incident_location = sanitize_input($input['incidentLocation'] ?? '');
    $respondent = sanitize_input($input['respondent'] ?? '');
    $witnesses = sanitize_input($input['witnesses'] ?? '');

    $blotter_number = generate_id('BLT');
    $recorded_by = 1;

    $sql = "INSERT INTO blotter_reports (blotter_number, reporter_name, reporter_contact, 
            reporter_address, incident_type, incident_description, incident_date, incident_location,
            respondent_name, witnesses, recorded_by, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssssssssi', $blotter_number, $reporter_name, $reporter_contact,
                     $reporter_address, $incident_type, $incident_description, $incident_date,
                     $incident_location, $respondent, $witnesses, $recorded_by);

    if ($stmt->execute()) {
        json_response(true, 'Blotter report filed successfully', ['blotter_number' => $blotter_number]);
    } else {
        json_response(false, 'Failed to file blotter: ' . $conn->error);
    }
}
?>
