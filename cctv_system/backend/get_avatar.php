<?php
// --- Allow requests from your React frontend ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight (OPTIONS) requests ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include('db.php');

// --- Validate required parameter ---
if (!isset($_GET['user_id'])) {
    echo json_encode([
        'status' => 'error',
        'message' => 'Missing user ID'
    ]);
    exit;
}

$user_id = intval($_GET['user_id']);

// --- Fetch avatar path from database ---
$query = "SELECT avatar_path FROM accounts WHERE id = ?";
$stmt = $conn->prepare($query);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result && $result->num_rows > 0) {
    $row = $result->fetch_assoc();
    $avatar_path = $row['avatar_path'];

    if (!empty($avatar_path)) {
        // Ensure correct base URL for your backend folder
        $base_url = "http://localhost/cctv_system/backend/";
        // Build absolute URL
        $avatar_url = $base_url . ltrim($avatar_path, '/');
    } else {
        $avatar_url = null;
    }

    echo json_encode([
        'status' => 'success',
        'avatar_url' => $avatar_url
    ]);
} else {
    echo json_encode([
        'status' => 'error',
        'message' => 'User not found'
    ]);
}

$stmt->close();
$conn->close();
?>
