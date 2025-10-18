<?php
header("Access-Control-Allow-Origin: http://localhost:3000");
header("Access-Control-Allow-Methods: POST, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Credentials: true");

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require 'vendor/autoload.php';
include 'db.php';

header('Content-Type: application/json');
error_reporting(E_ALL);
ini_set('display_errors', 1);

$input = json_decode(file_get_contents("php://input"), true);

if (!$input || empty($input['email'])) {
    echo json_encode(["status" => "error", "message" => "Email is required."]);
    exit;
}

$email = trim($input['email']);

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    echo json_encode(["status" => "error", "message" => "Invalid email format."]);
    exit;
}

// Ensure timezone consistency between PHP & MySQL
$conn->query("SET time_zone = '+08:00'");

// Check if account exists
$query = $conn->prepare("SELECT id, username FROM accounts WHERE email = ?");
if (!$query) {
    echo json_encode(["status" => "error", "message" => "Database error: " . $conn->error]);
    exit;
}
$query->bind_param("s", $email);
$query->execute();
$result = $query->get_result();

if ($result->num_rows === 0) {
    echo json_encode(["status" => "error", "message" => "No account found with that email."]);
    exit;
}

$user = $result->fetch_assoc();

// Generate verification code
$code = rand(100000, 999999);

// Ensure password_resets table exists
$conn->query("
    CREATE TABLE IF NOT EXISTS password_resets (
        id INT AUTO_INCREMENT PRIMARY KEY,
        account_id INT NOT NULL,
        email VARCHAR(150) NOT NULL UNIQUE,
        code VARCHAR(10) NOT NULL,
        expires_at DATETIME NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (account_id) REFERENCES accounts(id) ON DELETE CASCADE
    )
");

// Insert or update reset code using MySQL DATE_ADD for expiration
$insert = $conn->prepare("
    INSERT INTO password_resets (account_id, email, code, expires_at)
    VALUES (?, ?, ?, DATE_ADD(NOW(), INTERVAL 10 MINUTE))
    ON DUPLICATE KEY UPDATE code = VALUES(code), expires_at = DATE_ADD(NOW(), INTERVAL 10 MINUTE)
");
if (!$insert) {
    echo json_encode(["status" => "error", "message" => "Database insert error: " . $conn->error]);
    exit;
}
$insert->bind_param("iss", $user['id'], $email, $code);
$insert->execute();

// Send email with PHPMailer
$mail = new PHPMailer(true);

try {
    $mail->isSMTP();
    $mail->Host       = 'smtp.gmail.com';
    $mail->SMTPAuth   = true;
    $mail->Username   = 'rusettemaranan@gmail.com';
    $mail->Password   = 'jckixnkmckonybdq'; // App Password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port       = 587;

    $mail->setFrom('rusettemaranan@gmail.com', 'CCTV System');
    $mail->addAddress($email, $user['username']);
    $mail->isHTML(true);
    $mail->Subject = 'Your Password Reset Code';
    $mail->Body = "
        <h3>Hello {$user['username']},</h3>
        <p>You requested to reset your password.</p>
        <p>Your verification code is:</p>
        <h2 style='color:#007bff;'>$code</h2>
        <p>This code will expire in 10 minutes.</p>
        <br>
        <small>If you didn’t request this, please ignore this email.</small>
    ";

    $mail->send();
    echo json_encode(["status" => "success", "message" => "Verification code sent successfully."]);

} catch (Exception $e) {
    echo json_encode([
        "status" => "error",
        "message" => "Failed to send email. Please try again later.",
        "debug" => $mail->ErrorInfo
    ]);
}

$conn->close();
?>
