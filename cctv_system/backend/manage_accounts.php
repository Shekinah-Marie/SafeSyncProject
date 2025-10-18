<?php
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Headers: Content-Type");
header("Access-Control-Allow-Methods: GET, OPTIONS");
header("Content-Type: application/json");

include('db.php');

// Fetch all accounts
$sql = "SELECT a.id, a.username, a.email, 
        CASE 
          WHEN f.id IS NOT NULL THEN 'Enrolled'
          ELSE 'Not Enrolled'
        END AS remarks
        FROM accounts a
        LEFT JOIN faces f ON a.id = f.user_id
        GROUP BY a.id";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode(["status" => "error", "message" => "Database query failed: " . $conn->error]);
    exit;
}

$accounts = [];
while ($row = $result->fetch_assoc()) {
    $accounts[] = $row;
}

echo json_encode($accounts);
$conn->close();
?>
