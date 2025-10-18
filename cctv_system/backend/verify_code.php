<?php
// Allow frontend access (CORS)
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

// Enable debugging (temporary, remove in production)
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Decode input safely
$input = json_decode(file_get_contents("php://input"), true);
if (empty($input['email']) || empty($input['code'])) {
    echo json_encode(["status" => "error", "message" => "Email and code are required."]);
    exit;
}

$email = trim($input['email']);
$code  = trim($input['code']);

// Match timezone with MySQL (important for NOW() comparison)
date_default_timezone_set('Asia/Manila');
$conn->query("SET time_zone = '+08:00'");

// Clean up expired codes
$conn->query("DELETE FROM password_resets WHERE expires_at < NOW()");

// Debug: check if the code actually exists
$stmt = $conn->prepare("
    SELECT * FROM password_resets
    WHERE TRIM(email) = ? AND TRIM(code) = ? AND expires_at > NOW()
");
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
    exit;
}
$stmt->bind_param("ss", $email, $code);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode(["status" => "success", "message" => "Code verified."]);
} else {
    // Return debug info temporarily
    $debug = [];
    $res = $conn->query("SELECT email, code, expires_at, NOW() as current_time FROM password_resets");
    if ($res && $res->num_rows > 0) {
        $debug = $res->fetch_all(MYSQLI_ASSOC);
    }

    echo json_encode([
        "status" => "error",
        "message" => "Invalid or expired code.",
        "debug" => $debug // ⚠️ Remove later
    ]);
}

$stmt->close();
$conn->close();
?>
