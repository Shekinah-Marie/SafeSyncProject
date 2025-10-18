<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

include('db.php');
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['name'], $data['contact'], $data['address'])) {
    echo json_encode(["status" => "error", "message" => "All fields required."]);
    exit;
}

$name = $data['name'];
$contact = $data['contact'];
$address = $data['address'];

$stmt = $conn->prepare("INSERT INTO hotlines (name, contact, address) VALUES (?, ?, ?)");
$stmt->bind_param("sss", $name, $contact, $address);

if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Hotline added successfully."]);
} else {
    echo json_encode(["status" => "error", "message" => "Failed to add hotline."]);
}

$stmt->close();
$conn->close();
?>
