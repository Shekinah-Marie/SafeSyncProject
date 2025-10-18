<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight request (OPTIONS) ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
include('db.php');

// --- Read JSON input ---
$input = file_get_contents("php://input");
$data = json_decode($input, true);

// --- Validate user_id ---
if (!isset($data['user_id']) || empty($data['user_id'])) {
    echo json_encode(["status" => "error", "message" => "User ID required"]);
    exit;
}

$user_id = intval($data['user_id']);

// Update both login flag and last_active timestamp
$stmt = $conn->prepare("UPDATE accounts SET is_logged_in = 0, last_active = NOW() WHERE id = ?");
$stmt->bind_param("i", $user_id);

if ($stmt->execute()) {

    // Destroy session safely
    $_SESSION = array();
    if (ini_get("session.use_cookies")) {
        $params = session_get_cookie_params();
        setcookie(session_name(), '', time() - 42000,
            $params["path"], $params["domain"],
            $params["secure"], $params["httponly"]
        );
    }
    session_destroy();

    echo json_encode([
        "status" => "success",
        "message" => "User logged out successfully",
        "timestamp" => date("Y-m-d H:i:s")
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update user logout"
    ]);
}

$stmt->close();
$conn->close();
?>
