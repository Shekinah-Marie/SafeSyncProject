<?php
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");
header("Access-Control-Allow-Credentials: true");

// Handle OPTIONS preflight
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

include('db.php');

// --- Read raw JSON input ---
$rawInput = file_get_contents("php://input");

if (!$rawInput) {
    echo json_encode([
        "status" => "error",
        "message" => "No input received (empty body)"
    ]);
    exit;
}

// Decode JSON safely
$data = json_decode($rawInput, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        "status" => "error",
        "message" => "Invalid JSON format",
        "error" => json_last_error_msg(),
        "raw" => $rawInput
    ]);
    exit;
}

// --- Validate required fields ---
$required = ['account_id', 'name', 'confidence'];
foreach ($required as $field) {
    if (!isset($data[$field])) {
        echo json_encode([
            "status" => "error",
            "message" => "Missing required field: $field",
            "received" => $data
        ]);
        exit;
    }
}

// --- Sanitize input ---
$device_id  = intval($data['account_id']); // should match your camera/device ID
$name       = trim($data['name']);
$confidence = floatval($data['confidence']);

// --- Check if device exists ---
$check = $conn->prepare("SELECT id FROM devices WHERE id = ?");
if (!$check) {
    echo json_encode([
        "status" => "error",
        "message" => "SQL prepare failed on device check",
        "error" => $conn->error
    ]);
    exit;
}
$check->bind_param("i", $device_id);
if (!$check->execute()) {
    echo json_encode([
        "status" => "error",
        "message" => "SQL execute failed on device check",
        "error" => $check->error
    ]);
    $check->close();
    $conn->close();
    exit;
}
$check->store_result();
if ($check->num_rows === 0) {
    echo json_encode([
        "status" => "error",
        "message" => "Device ID not found in database",
        "device_id" => $device_id
    ]);
    $check->close();
    $conn->close();
    exit;
}
$check->close();

// --- Insert log entry ---
$sql = "INSERT INTO face_logs (device_id, name, confidence) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        "status" => "error",
        "message" => "SQL prepare failed on insert",
        "error" => $conn->error
    ]);
    exit;
}

$stmt->bind_param("isd", $device_id, $name, $confidence);

if ($stmt->execute()) {
    echo json_encode([
        "status" => "success",
        "message" => "Face log recorded successfully",
        "logged" => [
            "device_id" => $device_id,
            "name" => $name,
            "confidence" => $confidence,
            "timestamp" => date("Y-m-d H:i:s")
        ]
    ]);
} else {
    echo json_encode([
        "status" => "error",
        "message" => "Database insert failed",
        "error" => $stmt->error,
        "errno" => $stmt->errno,
        "affected_rows" => $stmt->affected_rows
    ]);
}

// Close connections
$stmt->close();
$conn->close();
?>
