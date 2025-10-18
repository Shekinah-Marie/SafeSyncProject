<?php
// Allow CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
include('db.php');

// Get user ID from query string
if (!isset($_GET['id'])) {
    echo json_encode(["status" => "error", "message" => "User ID required."]);
    exit;
}

$id = intval($_GET['id']);

// Fetch user details
$stmt = $conn->prepare("SELECT id, username, email, contact, created_at FROM accounts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode($result->fetch_assoc());
} else {
    echo json_encode(["status" => "error", "message" => "User not found."]);
}

$stmt->close();
$conn->close();
?>
