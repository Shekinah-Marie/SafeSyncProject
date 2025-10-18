<?php
// --- Allow requests from React frontend ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight request (OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Start session before any output ---
session_start();

// --- Include database connection ---
include('db.php');

// --- Read JSON or form input safely ---
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// Fallback: if JSON decoding failed, check for form POST data
if (!$data) {
    $data = $_POST;
}

// --- Validate input ---
if (!isset($data['email']) || !isset($data['password'])) {
    echo json_encode(["status" => "error", "message" => "Invalid request data"]);
    exit;
}

$email = trim($data['email']);
$password = $data['password'];

// --- Prepare and execute query ---
$sql = "SELECT id, username, email, password, avatar_path FROM accounts WHERE email = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Database error"]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

// --- Check user existence ---
if ($result && $result->num_rows === 1) {
    $row = $result->fetch_assoc();

    // --- Verify password ---
    if (password_verify($password, $row['password'])) {

        // Store session
        $_SESSION['user_id'] = $row['id'];
        $_SESSION['username'] = $row['username'];
        $_SESSION['email'] = $row['email'];

        // Update login status
        $update = $conn->prepare("UPDATE accounts SET is_logged_in = 1, last_active = NOW() WHERE id = ?");
        $update->bind_param("i", $row['id']);
        $update->execute();
        $update->close();

        // Build absolute avatar URL (if available)
        $avatar_url = null;
        if (!empty($row['avatar_path'])) {
            $avatar_url = "http://localhost/cctv_system/backend/" . $row['avatar_path'];
        }

        // Send successful response
        echo json_encode([
            "status" => "success",
            "user_id" => $row['id'],
            "username" => $row['username'],
            "email" => $row['email'],
            "avatar_url" => $avatar_url,
            "message" => "Login successful"
        ]);
    } else {    
        echo json_encode(["status" => "error", "message" => "Invalid password"]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Account not found"]);
}

// --- Cleanup ---
$stmt->close();
$conn->close();
?>
