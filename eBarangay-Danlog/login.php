<?php
require_once '../config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    json_response(false, 'Invalid request method');
}

$input = json_decode(file_get_contents('php://input'), true);

$identifier = sanitize_input($input['identifier'] ?? '');
$password = $input['password'] ?? '';
$user_type = sanitize_input($input['user_type'] ?? 'resident');

if (empty($identifier) || empty($password)) {
    json_response(false, 'Please provide all required fields');
}

// Query user
$sql = "SELECT * FROM users WHERE (username = ? OR email = ?) AND role = ? AND status = 'active' LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param('sss', $identifier, $identifier, $user_type);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    json_response(false, 'Invalid credentials');
}

$user = $result->fetch_assoc();

// Verify password
if (!verify_password($password, $user['password_hash'])) {
    json_response(false, 'Invalid credentials');
}

// Update last login
$update_sql = "UPDATE users SET last_login = NOW() WHERE user_id = ?";
$update_stmt = $conn->prepare($update_sql);
$update_stmt->bind_param('i', $user['user_id']);
$update_stmt->execute();

// Remove password from response
unset($user['password_hash']);

// Create session or return token
session_start();
$_SESSION['user_id'] = $user['user_id'];
$_SESSION['role'] = $user['role'];

json_response(true, 'Login successful', $user);
?>
