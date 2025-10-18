<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

include('db.php');

// Handle preflight request (for CORS)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Get JSON input
$data = json_decode(file_get_contents("php://input"), true);

if (!$data) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid JSON input"
    ]);
    exit;
}

$name = $data['name'] ?? '';
$contact = $data['contact'] ?? '';
$user_id = $data['user_id'] ?? 0;
$image_path = $data['image_path'] ?? '';

// Step 1: Check if user_id already has a face enrolled
$check_sql = "SELECT * FROM faces WHERE user_id = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("i", $user_id);
$check_stmt->execute();
$result = $check_stmt->get_result();

if ($result->num_rows > 0) {
    echo json_encode([
        "status" => "error",
        "message" => "This user has already enrolled a face. Only one enrollment per user is allowed."
    ]);
    $check_stmt->close();
    $conn->close();
    exit;
}

$check_stmt->close();

// Step 2: Save new face record
$sql = "INSERT INTO faces (user_id, name, contact, image_path) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("isss", $user_id, $name, $contact, $image_path);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "Face registered successfully"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Database insert failed: " . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>
