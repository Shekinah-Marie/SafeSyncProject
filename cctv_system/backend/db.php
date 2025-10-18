<?php
$host = "localhost";
$user = "root"; // your phpMyAdmin username
$pass = ""; // your phpMyAdmin password (usually empty in XAMPP)
$dbname = "cctv_system";

$conn = new mysqli($host, $user, $pass, $dbname);

if ($conn->connect_error) {
    die(json_encode(["status" => "error", "message" => "Database connection failed: " . $conn->connect_error]));
}
?>
