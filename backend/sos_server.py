from flask import Flask, jsonify, request
from flask_socketio import SocketIO
from flask_cors import CORS
import mysql.connector
from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = "sos_secret!"
CORS(app)  
socketio = SocketIO(app, cors_allowed_origins="*")

# === Database Connection ===
def get_db_connection():
    return mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  
        database="cctv_system"
    )

# === Default Root Route ===
@app.route("/")
def index():
    """Used for server health check"""
    return jsonify({
        "status": "running",
        "service": "SOS Alert Service",
        "message": "Server is active and ready for SOS alerts."
    }), 200

# === Trigger SOS ===
@app.route("/trigger_sos", methods=["POST"])
def trigger_sos():
    """Receive and broadcast SOS alerts"""
    data = request.get_json()
    username = data.get("username", "Unknown User")
    location = data.get("location", "Unknown Location")
    message = data.get("message", "🚨 Emergency! Immediate help needed.")

    print("\n🚨 SOS ALERT RECEIVED 🚨")
    print(f"User: {username}")
    print(f"Location: {location}")
    print(f"Message: {message}")

    # Optional: Log to DB
    try:
        conn = get_db_connection()
        cursor = conn.cursor()
        cursor.execute(
            "INSERT INTO sos_alerts (username, location, message, created_at) VALUES (%s, %s, %s, %s)",
            (username, location, message, datetime.now())
        )
        conn.commit()
        cursor.close()
        conn.close()
    except Exception as e:
        print("Database logging failed:", e)

    # Broadcast to all connected clients
    socketio.emit("sos_alert", {
        "username": username,
        "location": location,
        "message": message
    })

    return jsonify({"success": True, "message": "SOS broadcasted successfully!"})

# === WebSocket Events ===
@socketio.on("connect")
def on_connect():
    print("🟢 SOS client connected")

@socketio.on("disconnect")
def on_disconnect():
    print("🔴 SOS client disconnected")

if __name__ == "__main__":
    print("[INFO] Starting SOS Alert Service at http://localhost:5002")
    socketio.run(app, host="0.0.0.0", port=5002, debug=True)
