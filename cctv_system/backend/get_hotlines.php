<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

header('Content-Type: application/json');
include('db.php');

// Fetch all hotlines
$query = "SELECT id, name, contact, address, created_at FROM hotlines ORDER BY created_at DESC";
$result = $conn->query($query);

$hotlines = [];

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        $hotlines[] = $row;
    }
}

echo json_encode($hotlines);

$conn->close();
?>
