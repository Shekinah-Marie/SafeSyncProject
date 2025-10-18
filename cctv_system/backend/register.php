<?php
// --- Allow React frontend requests ---
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header('Content-Type: application/json');

// --- Include database connection ---
include('db.php');

// --- Read JSON input safely ---
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// --- Handle empty or invalid JSON ---
if (!$data || !is_array($data)) {
    echo json_encode(["status" => "error", "message" => "Invalid JSON input"]);
    exit;
}

// --- Validate fields ---
$username = isset($data['username']) ? trim($data['username']) : null;
$email = isset($data['email']) ? trim($data['email']) : null;
$password_raw = isset($data['password']) ? $data['password'] : null;

if (!$username || !$email || !$password_raw) {
    echo json_encode(["status" => "error", "message" => "All fields are required"]);
    exit;
}

// --- Hash password ---
$password = password_hash($password_raw, PASSWORD_DEFAULT);

// --- Check if email already exists ---
$check_sql = "SELECT id FROM accounts WHERE email = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("s", $email);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result && $check_result->num_rows > 0) {
    echo json_encode(["status" => "error", "message" => "Email already registered"]);
    $check_stmt->close();
    $conn->close();
    exit;
}

// --- Insert new user ---
$sql = "INSERT INTO accounts (username, email, password) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Database prepare failed: " . $conn->error]);
    $conn->close();
    exit;
}

$stmt->bind_param("sss", $username, $email, $password);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Account registered successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
}

// --- Cleanup ---
$stmt->close();
$conn->close();
?>
