<?php
header('Content-Type: application/json');

// Get the user_id from URL
$user_id = $_GET['user_id'] ?? null;

if (!$user_id) {
    echo json_encode(["status" => "error", "message" => "Missing user_id"]);
    exit;
}

// Path to your Python script
$pythonScript = "C:\\Users\\ASUS\\Desktop\\CCTV\\1_capture_dataset.py";

// Run Python script
$command = escapeshellcmd("python \"$pythonScript\" $user_id");
$output = shell_exec($command);

echo json_encode(["status" => "success", "message" => "Python script executed", "output" => $output]);
?>
