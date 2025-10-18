<?php
// Allow CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include('db.php');
header('Content-Type: application/json');

// Get input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'], $data['username'], $data['email'], $data['contact'])) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit;
}

$id = intval($data['id']);
$username = trim($data['username']);
$email = trim($data['email']);
$contact = trim($data['contact']);

// Validate
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Invalid email format."]);
    exit;
}

if (strlen($username) < 3) {
    echo json_encode(["status" => "error", "message" => "Username must be at least 3 characters."]);
    exit;
}

// Update user info
$stmt = $conn->prepare("UPDATE accounts SET username = ?, email = ?, contact = ? WHERE id = ?");
$stmt->bind_param("sssi", $username, $email, $contact, $id);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Account details updated successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update account."]);
}

$stmt->close();
$conn->close();
?>
