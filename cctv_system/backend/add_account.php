<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Content-Type: application/json");

include('db.php');

// Read and decode input JSON
$input = file_get_contents("php://input");
$data = json_decode($input, true);

if (!$data || !isset($data['username']) || !isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["status" => "error", "message" => "Invalid or missing input data"]);
    exit;
}

$username = trim($data['username']);
$email = trim($data['email']);
$password_raw = $data['password'];

// Hash password
$password = password_hash($password_raw, PASSWORD_DEFAULT);

// Check if email or username already exists
$check_sql = "SELECT id FROM accounts WHERE email = ? OR username = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("ss", $email, $username);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result && $check_result->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Username or email already exists"]);
    $check_stmt->close();
    $conn->close();
    exit;
}
$check_stmt->close();

// Insert new user
$sql = "INSERT INTO accounts (username, email, password) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Database prepare failed: " . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sss", $username, $email, $password);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Account added successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to add account: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
