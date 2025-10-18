<?php
// Allow CORS for your React app
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

// Fetch all currently logged-in accounts
$query = "SELECT id, username, email, contact, last_active 
          FROM accounts 
          WHERE is_logged_in = 1 
          ORDER BY username ASC";

$result = $conn->query($query);

if ($result && $result->num_rows > 0) {
    $users = [];
    while ($row = $result->fetch_assoc()) {
        $users[] = [
            "id" => $row["id"],
            "username" => $row["username"],
            "email" => $row["email"],
            "contact" => $row["contact"],
            "last_active" => $row["last_active"]
        ];
    }

    echo json_encode([
        "success" => true,
        "count" => count($users),
        "users" => $users
    ]);
} else {
    echo json_encode([
        "success" => true,
        "count" => 0,
        "users" => []
    ]);
}

$conn->close();
?>
