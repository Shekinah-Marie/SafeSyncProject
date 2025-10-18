<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json");

include('db.php');

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

$data = json_decode(file_get_contents("php://input"), true);

// Validate input
if (
    !isset($data['id']) || 
    empty(trim($data['name'])) || 
    empty(trim($data['contact'])) || 
    empty(trim($data['address']))
) {
    echo json_encode([
        "status" => "error",
        "message" => "All fields are required."
    ]);
    exit;
}

$id = intval($data['id']);
$name = trim($data['name']);
$contact = trim($data['contact']);
$address = trim($data['address']);

$stmt = $conn->prepare("UPDATE hotlines SET name = ?, contact = ?, address = ? WHERE id = ?");
$stmt->bind_param("sssi", $name, $contact, $address, $id);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "Hotline updated successfully!"
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to update hotline. Please try again."
    ]);
}

$stmt->close();
$conn->close();
?>
