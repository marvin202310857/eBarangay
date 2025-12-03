<?php
require_once '../config.php';

$method = $_SERVER['REQUEST_METHOD'];

switch($method) {
    case 'GET':
        get_announcements();
        break;
    case 'POST':
        add_announcement();
        break;
    default:
        json_response(false, 'Invalid request method');
}

function get_announcements() {
    global $conn;

    $sql = "SELECT a.*, CONCAT(u.first_name, ' ', u.last_name) as posted_by_name
            FROM announcements a
            LEFT JOIN users u ON a.posted_by = u.user_id
            WHERE a.status = 'published' AND a.publish_date <= NOW()
            ORDER BY a.publish_date DESC
            LIMIT 50";

    $result = $conn->query($sql);
    $announcements = [];

    while ($row = $result->fetch_assoc()) {
        $announcements[] = $row;
    }

    json_response(true, 'Announcements retrieved successfully', $announcements);
}

function add_announcement() {
    global $conn;

    $input = json_decode(file_get_contents('php://input'), true);

    $title = sanitize_input($input['title'] ?? '');
    $content = sanitize_input($input['content'] ?? '');
    $category = sanitize_input($input['category'] ?? 'general');
    $priority = sanitize_input($input['priority'] ?? 'normal');
    $publish_date = sanitize_input($input['publishDate'] ?? date('Y-m-d H:i:s'));
    $posted_by = 1;

    $sql = "INSERT INTO announcements (title, content, category, priority, posted_by, 
            publish_date, status)
            VALUES (?, ?, ?, ?, ?, ?, 'published')";

    $stmt = $conn->prepare($sql);
    $stmt->bind_param('ssssis', $title, $content, $category, $priority, $posted_by, $publish_date);

    if ($stmt->execute()) {
        json_response(true, 'Announcement published successfully', ['announcement_id' => $conn->insert_id]);
    } else {
        json_response(false, 'Failed to publish announcement: ' . $conn->error);
    }
}
?>
