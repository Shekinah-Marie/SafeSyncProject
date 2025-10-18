<?php
// --- Allow CORS from React frontend ---
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

// --- Handle preflight (OPTIONS) requests ---
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// --- Include database connection ---
include('db.php');

// --- Validate user_id ---
if (!isset($_POST['user_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user ID']);
    exit;
}

$user_id = intval($_POST['user_id']);

// --- Validate uploaded file ---
if (!isset($_FILES['avatar']) || $_FILES['avatar']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['status' => 'error', 'message' => 'No valid file uploaded']);
    exit;
}

// --- Define upload directory ---
$upload_dir = __DIR__ . "/uploads/avatars/";
$base_url = "http://localhost/cctv_system/backend/";

// --- Create upload directory if missing ---
if (!file_exists($upload_dir)) {
    mkdir($upload_dir, 0777, true);
}

// --- Generate safe and unique file name ---
$file_extension = strtolower(pathinfo($_FILES['avatar']['name'], PATHINFO_EXTENSION));
$allowed_extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp'];

if (!in_array($file_extension, $allowed_extensions)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid file type']);
    exit;
}

$file_name = "avatar_" . $user_id . "_" . time() . "." . $file_extension;
$target_file = $upload_dir . $file_name;

// --- Move uploaded file ---
if (move_uploaded_file($_FILES['avatar']['tmp_name'], $target_file)) {

    // Save relative path in DB (for consistency)
    $relative_path = "uploads/avatars/" . $file_name;

    // Update user's avatar in `accounts` table
    $query = "UPDATE accounts SET avatar_path = ? WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("si", $relative_path, $user_id);
    $stmt->execute();
    $stmt->close();

    // Return success response with absolute URL
    echo json_encode([
        'status' => 'success',
        'avatar_url' => $base_url . $relative_path
    ]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'File upload failed']);
}

$conn->close();
?>
