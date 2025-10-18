<?php
// Allow CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Credentials: true");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Content-Type: application/json; charset=UTF-8");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

session_start();
include('db.php');

// Check if user session exists
if (isset($_SESSION['user_id'])) {
    $user_id = $_SESSION['user_id'];

    // Always fetch the latest username from the database
    $stmt = $conn->prepare("SELECT username FROM accounts WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($row = $result->fetch_assoc()) {
        $username = $row['username'];

        // Update session to keep it in sync
        $_SESSION['username'] = $username;

        echo json_encode([
            "success" => true,
            "username" => $username,
            "user_id" => $user_id
        ]);
    } else {
        echo json_encode([
            "success" => false,
            "message" => "User not found. Please log in again."
        ]);
    }

    $stmt->close();
} else {
    echo json_encode([
        "success" => false,
        "message" => "No active session. Please log in again."
    ]);
}

$conn->close();
?>
