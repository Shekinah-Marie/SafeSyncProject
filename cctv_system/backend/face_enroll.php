heres my current face_enroll.php

<?php
// Allow cross-origin requests from React frontend
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With");

// Handle preflight request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

header('Content-Type: application/json');
include('db.php');

// Read JSON input (React sends base64 in JSON)
$input = json_decode(file_get_contents("php://input"), true);
if (!$input || !isset($input['user_id'], $input['name'], $input['contact'], $input['image'])) {
    echo json_encode(["status" => "error", "message" => "Missing required data."]);
    exit();
}

$user_id = intval($input['user_id']);
$name = trim($input['name']);
$contact = trim($input['contact']);
$imageData = $input['image'];

// Decode Base64 image safely
$imageDecoded = base64_decode(preg_replace('#^data:image/\w+;base64,#i', '', $imageData));
if ($imageDecoded === false) {
    echo json_encode(["status" => "error", "message" => "Invalid image data."]);
    exit();
}

// Create temporary file for duplicate check
$tempDir = realpath(__DIR__ . "/../temp_uploads");
if ($tempDir === false) {
    $tempDir = __DIR__ . "/../temp_uploads";
    mkdir($tempDir, 0777, true);
}
$tempPath = $tempDir . "/temp_" . uniqid() . ".jpg";
file_put_contents($tempPath, $imageDecoded);

// Use Python 3.11 explicitly
$pythonPath = "C:\\Users\\ASUS\\AppData\\Local\\Programs\\Python\\Python311\\python.exe";

// Run Python duplicate check
$pythonScript = realpath(__DIR__ . "/../check_duplicate.py");
$cmd = escapeshellarg($pythonPath) . " " . escapeshellarg($pythonScript) . " " . escapeshellarg($tempPath) . " 2>&1";
exec($cmd, $outputLines, $returnCode);
$pythonOutput = implode("\n", $outputLines);

// Handle Python script responses
if (strpos($pythonOutput, "DUPLICATE") !== false) {
    unlink($tempPath);
    $parts = explode(':', $pythonOutput);
    $matchInfo = isset($parts[1]) ? " (matched ID: {$parts[1]})" : "";
    echo json_encode([
        "status" => "error",
        "message" => "This face already exists in the system." . $matchInfo
    ]);
    exit();
}

if ($returnCode !== 0 && strpos($pythonOutput, "NO_MODEL") === false) {
    unlink($tempPath);
    echo json_encode(["status" => "error", "message" => "Duplicate check failed: " . $pythonOutput]);
    exit();
}

// Passed duplicate check → move to dataset
$datasetUserDir = realpath(__DIR__ . "/../dataset/user_{$user_id}");
if ($datasetUserDir === false) {
    $datasetUserDir = __DIR__ . "/../dataset/user_{$user_id}";
    mkdir($datasetUserDir, 0777, true);
}

// Sanitize name for safe filename
$sanitizedName = preg_replace("/[^a-zA-Z0-9_-]/", "_", $name);
$finalFilename = $sanitizedName . "_" . time() . ".jpg";
$finalPath = $datasetUserDir . "/" . $finalFilename;

// Move file from temp to final location
if (!rename($tempPath, $finalPath)) {
    copy($tempPath, $finalPath);
    unlink($tempPath);
}

// Save record in DB
$relativePath = "dataset/user_{$user_id}/" . $finalFilename;
$sql = "INSERT INTO faces (user_id, name, contact, image_path) VALUES (?, ?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("isss", $user_id, $name, $contact, $relativePath);

if ($stmt->execute()) {
    // Retrain model in background (also uses Python 3.11)
    $trainScript = realpath(__DIR__ . "/../2_train_classifier.py");
    $trainCmd = escapeshellarg($pythonPath) . " " . escapeshellarg($trainScript) . " 2>&1";
    exec($trainCmd, $trainOut, $trainReturn);

    echo json_encode([
        "status" => "success",
        "message" => "Face enrolled successfully and model retrained."
    ]);
} else {
    if (file_exists($finalPath)) unlink($finalPath);
    echo json_encode(["status" => "error", "message" => "Database error: " . $stmt->error]);
}

$stmt->close();
$conn->close();
?>
