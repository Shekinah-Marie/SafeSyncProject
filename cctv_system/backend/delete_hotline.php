<?php
// Allow CORS
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include('db.php');
header('Content-Type: application/json');

// Read input
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['id'])) {
    echo json_encode(["status" => "error", "message" => "Missing hotline ID."]);
    exit;
}

$id = intval($data['id']);

// Delete hotline record
$stmt = $conn->prepare("DELETE FROM hotlines WHERE id = ?");
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(["status" => "success", "message" => "Hotline deleted successfully."]);
    } else {
        echo json_encode(["status" => "error", "message" => "Hotline not found."]);
    }
} else {
    echo json_encode(["status" => "error", "message" => "Failed to delete hotline."]);
}

$stmt->close();
$conn->close();
?>
