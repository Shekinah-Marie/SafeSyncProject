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

$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'], $data['current_password'], $data['new_password'])) {
    echo json_encode(["status" => "error", "message" => "All fields are required."]);
    exit;
}

$id = intval($data['id']);
$current_password = $data['current_password'];
$new_password = $data['new_password'];

// Validate new password length
if (strlen($new_password) < 6) {
    echo json_encode(["status" => "error", "message" => "New password must be at least 6 characters."]);
    exit;
}

// Fetch current hashed password
$stmt = $conn->prepare("SELECT password FROM accounts WHERE id = ?");
$stmt->bind_param("i", $id);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "User not found."]);
    $stmt->close();
    exit;
}

$stmt->bind_result($hashed_password);
$stmt->fetch();

// Verify current password
if (!password_verify($current_password, $hashed_password)) {
    echo json_encode(["status" => "error", "message" => "Current password is incorrect."]);
    $stmt->close();
    exit;
}

$stmt->close();

// Hash and update new password
$new_hashed = password_hash($new_password, PASSWORD_DEFAULT);

$update_stmt = $conn->prepare("UPDATE accounts SET password = ? WHERE id = ?");
$update_stmt->bind_param("si", $new_hashed, $id);

if ($update_stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Password changed successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to change password."]);
}

$update_stmt->close();
$conn->close();
?>
