<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");
header('Content-Type: application/json');

// Suppress PHP notices/warnings from breaking JSON
error_reporting(E_ALL & ~E_NOTICE & ~E_WARNING);
ini_set('display_errors', 0);

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('db.php');

$response = [];

try {
    $device_id = isset($_GET['device_id']) ? intval($_GET['device_id']) : null;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    if ($limit <= 0) $limit = 10;

    if ($device_id) {
        $sql = "SELECT device_id, name, confidence, timestamp 
                FROM face_logs 
                WHERE device_id = ? 
                ORDER BY timestamp DESC 
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new Exception("SQL prepare failed: " . $conn->error);
        $stmt->bind_param("ii", $device_id, $limit);
    } else {
        $sql = "SELECT device_id, name, confidence, timestamp 
                FROM face_logs 
                ORDER BY timestamp DESC 
                LIMIT ?";
        $stmt = $conn->prepare($sql);
        if (!$stmt) throw new Exception("SQL prepare failed: " . $conn->error);
        $stmt->bind_param("i", $limit);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    $logs = [];
    while ($row = $result->fetch_assoc()) {
        $logs[] = [
            "device_id" => $row['device_id'],
            "name" => $row['name'],
            "confidence" => floatval($row['confidence']),
            "timestamp" => $row['timestamp']
        ];
    }

    $response = [
        "status" => "success",
        "logs" => $logs
    ];

} catch (Exception $e) {
    $response = [
        "status" => "error",
        "message" => $e->getMessage()
    ];
}

echo json_encode($response);

if (isset($stmt) && $stmt) $stmt->close();
$conn->close();
?>
