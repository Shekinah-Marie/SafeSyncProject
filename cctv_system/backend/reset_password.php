<?php
// Allow CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
include('db.php');

// Decode JSON body
$input = json_decode(file_get_contents("php://input"), true);

if (empty($input['email']) || empty($input['password'])) {
    echo json_encode(["status" => "error", "message" => "Email and new password required."]);
    exit;
}

$email = trim($input['email']);
$new_password = trim($input['password']);

// Basic validation
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Invalid email format."]);
    exit;
}
if (strlen($new_password) < 6) {
    echo json_encode(["status" => "error", "message" => "Password must be at least 6 characters."]);
    exit;
}

// Hash the password securely
$hashed_password = password_hash($new_password, PASSWORD_DEFAULT);

// Update the user's password
$stmt = $conn->prepare("UPDATE accounts SET password = ? WHERE email = ?");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Database prepare failed: " . $conn->error]);
    exit;
}
$stmt->bind_param("ss", $hashed_password, $email);
$stmt->execute();

// Check if update worked
if ($stmt->affected_rows > 0) {
    // Clean up the reset record
    $cleanup = $conn->prepare("DELETE FROM password_resets WHERE email = ?");
    if ($cleanup) {
        $cleanup->bind_param("s", $email);
        $cleanup->execute();
        $cleanup->close();
    }

    echo json_encode(["status" => "success", "message" => "Password updated successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to update password. Email not found or unchanged."]);
}

$stmt->close();
$conn->close();
?>
