from flask_cors import CORS
from flask import Flask, jsonify, request, Response
import mysql.connector
import cv2
from werkzeug.security import generate_password_hash

app = Flask(__name__)

CORS(
    app,
    supports_credentials=True,
    resources={r"/*": {"origins": ["http://localhost:3000"]}}
)

@app.after_request
def apply_cors(response):
    # Make absolutely sure all the required headers are present
    response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
    response.headers["Access-Control-Allow-Credentials"] = "true"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response

# ------------------ DATABASE CONNECTION ------------------
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # leave blank if XAMPP default
        database="cctv_system"
    )

# ------------------ DEVICE MANAGEMENT ------------------
@app.route("/devices", methods=["GET"])
def get_devices():
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM devices")
        devices = cursor.fetchall()
        cursor.close()
        conn.close()
        return jsonify(devices)
    except Exception as e:
        return jsonify({"error": str(e)}), 500


@app.route("/devices", methods=["POST"])
def add_device():
    data = request.get_json()
    name = data.get("name")
    location = data.get("location")

    if not name or not location:
        return jsonify({"error": "Name and location are required"}), 400

    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("INSERT INTO devices (name, location) VALUES (%s, %s)", (name, location))
        conn.commit()
        new_id = cursor.lastrowid
        cursor.close()
        conn.close()
        return jsonify({"message": "Device added", "device": {"id": new_id, "name": name, "location": location}})
    except Exception as e:
        return jsonify({"error": str(e)}), 500


# ------------------ MANAGE ACCOUNTS ------------------

@app.route("/manage-accounts", methods=["GET"])
def manage_accounts():
    """Fetch all accounts + check if each has an enrolled face"""
    try:
        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        query = """
            SELECT a.id, a.username, a.email,
                   CASE WHEN f.id IS NOT NULL THEN 'Enrolled' ELSE 'Not Enrolled' END AS remarks
            FROM accounts a
            LEFT JOIN faces f ON f.user_id = a.id
            ORDER BY a.id ASC
        """
        cursor.execute(query)
        accounts = cursor.fetchall()

        cursor.close()
        conn.close()
        return jsonify(accounts)
    except Exception as e:
        print("Error:", e)
        return jsonify({"error": str(e)}), 500


@app.route("/add-account", methods=["POST"])
def add_account():
    """Add a new account (with hashed password)"""
    try:
        data = request.get_json()
        username = data.get("username")
        email = data.get("email")
        password_raw = data.get("password")

        if not username or not email or not password_raw:
            return jsonify({"success": False, "message": "All fields are required"}), 400

        conn = get_db_connection()
        cursor = conn.cursor(dictionary=True)

        # Check for duplicates (username or email)
        cursor.execute("SELECT id FROM accounts WHERE username = %s OR email = %s", (username, email))
        existing = cursor.fetchone()
        if existing:
            cursor.close()
            conn.close()
            return jsonify({"success": False, "message": "Username or email already exists"})

        # Hash password
        hashed_password = generate_password_hash(password_raw)

        # Insert new account
        cursor.execute(
            "INSERT INTO accounts (username, email, password) VALUES (%s, %s, %s)",
            (username, email, hashed_password)
        )
        conn.commit()

        cursor.close()
        conn.close()

        return jsonify({"success": True, "message": "Account added successfully"})
    except Exception as e:
        print("Error adding account:", e)
        return jsonify({"success": False, "message": str(e)}), 500

# ------------------ VIDEO STREAMING ------------------
cameras = {}

def generate_frames(device_id):
    cam_index = 0  # default laptop webcam
    camera = cameras.get(device_id)

    if camera is None:
        camera = cv2.VideoCapture(cam_index)
        cameras[device_id] = camera

    while True:
        success, frame = camera.read()
        if not success:
            break

        _, buffer = cv2.imencode('.jpg', frame)
        frame = buffer.tobytes()

        yield (b'--frame\r\n'
               b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')


@app.route("/video_feed/<int:device_id>")
def video_feed(device_id):
    return Response(generate_frames(device_id),
                    mimetype="multipart/x-mixed-replace; boundary=frame")


# ------------------ DATABASE TEST ENDPOINT ------------------
@app.route("/test_db")
def test_db():
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute("SHOW TABLES")
        tables = [t[0] for t in cursor.fetchall()]
        cursor.close()
        conn.close()
        return jsonify({"status": "success", "tables": tables})
    except Exception as e:
        return jsonify({"status": "error", "message": str(e)})


# ------------------ MAIN ------------------
if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
