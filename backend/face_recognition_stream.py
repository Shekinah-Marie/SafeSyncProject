from flask import Flask, Response, jsonify, request
from flask_cors import CORS
import cv2
import os
import threading
import time
import mysql.connector
import requests
import json
import traceback

app = Flask(__name__)

CORS(app, supports_credentials=True, resources={r"/*": {"origins": "http://localhost:3000"}})

# === PATHS ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINER_PATH = os.path.join(BASE_DIR, "trainer", "trainer.yml")
LABELS_PATH = os.path.join(BASE_DIR, "trainer", "labels.json")
CASCADE_PATH = os.path.join(BASE_DIR, "haarcascade", "haarcascade_frontalface_default.xml")

# === DB CONNECTION ===
def get_db_connection():
    try:
        return mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="cctv_system",
            connection_timeout=10,
            auth_plugin="mysql_native_password",
        )
    except Exception as e:
        print("[ERROR] MySQL connection failed:", e)
        return None


# === FACE DETECTOR ===
if not os.path.exists(CASCADE_PATH):
    raise FileNotFoundError(f"Haarcascade not found at {CASCADE_PATH}")
face_detector = cv2.CascadeClassifier(CASCADE_PATH)


# === LOAD RECOGNIZER ===
recognizer_lock = threading.Lock()

def load_recognizer():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    try:
        if os.path.exists(TRAINER_PATH):
            recognizer.read(TRAINER_PATH)
            print("[INFO] Recognizer model loaded.")
        else:
            print("[WARN] trainer.yml not found — run training first.")
    except Exception as e:
        print("[ERROR] Failed to load recognizer:", e)
    return recognizer

recognizer = load_recognizer()
last_trainer_modified = os.path.getmtime(TRAINER_PATH) if os.path.exists(TRAINER_PATH) else 0
last_labels_modified = os.path.getmtime(LABELS_PATH) if os.path.exists(LABELS_PATH) else 0


# === LOAD LABELS ===
def load_label_names():
    label_map = {}
    try:
        if os.path.exists(LABELS_PATH):
            with open(LABELS_PATH, "r", encoding="utf-8") as f:
                raw = json.load(f)
                label_map = {int(k): v for k, v in raw.items()}
            print(f"[INFO] Loaded {len(label_map)} labels from labels.json")
            return label_map
    except Exception as e:
        print(f"[WARN] labels.json load failed: {e}")

    try:
        conn = get_db_connection()
        if conn:
            cursor = conn.cursor()
            cursor.execute("SELECT user_id, name FROM faces")
            results = cursor.fetchall()
            conn.close()
            label_map = {int(uid): name for uid, name in results}
            print(f"[INFO] Loaded {len(label_map)} labels from DB fallback.")
    except Exception as e:
        print("[WARN] DB fallback failed:", e)

    return label_map

label_names = load_label_names()

# === AUTO RELOAD MODEL ON UPDATE ===
def monitor_trainer_updates():
    global recognizer, last_trainer_modified, label_names, last_labels_modified
    while True:
        try:
            updated = False

            if os.path.exists(TRAINER_PATH):
                modified = os.path.getmtime(TRAINER_PATH)
                if modified > last_trainer_modified:
                    with recognizer_lock:
                        print("[UPDATE] trainer.yml changed — reloading...")
                        recognizer = load_recognizer()
                        last_trainer_modified = modified
                        updated = True

            if os.path.exists(LABELS_PATH):
                modified = os.path.getmtime(LABELS_PATH)
                if modified > last_labels_modified:
                    with recognizer_lock:
                        print("[UPDATE] labels.json changed — reloading...")
                        label_names = load_label_names()
                        last_labels_modified = modified
                        updated = True

            if updated:
                print("[INFO] Model and/or labels reloaded successfully.")
            time.sleep(5)
        except Exception as e:
            print("[WARN] Monitor thread error:", e)
            time.sleep(5)

threading.Thread(target=monitor_trainer_updates, daemon=True).start()

    
# === FETCH DEVICES ===
def get_all_devices():
    try:
        conn = get_db_connection()
        if not conn:
            print("[ERROR] No DB connection in get_all_devices()")
            return []
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM devices ORDER BY id ASC")
        rows = cursor.fetchall()
        conn.close()
        return rows
    except Exception as e:
        print("[ERROR] get_all_devices failed:", e)
        traceback.print_exc()
        return []

# === ADD DEVICE ===
@app.route("/devices", methods=["POST"])
def add_device():
    try:
        data = request.json or {}
        name = data.get("name")
        if not name:
            return jsonify({"error": "Device name required"}), 400

        location = data.get("location", "")
        device_type = data.get("device_type", "USB")

        def safe_int(val):
            try:
                return int(val) if val not in [None, "", "null"] else None
            except:
                return None

        camera_index = safe_int(data.get("camera_index"))
        usb_port = safe_int(data.get("usb_port"))
        port = safe_int(data.get("port"))
        ip_address = data.get("ip_address") or None
        username = data.get("username") or None
        password = data.get("password") or None
        rtsp_path = data.get("rtsp_path") or None

        conn = get_db_connection()
        if not conn:
            return jsonify({"error": "DB connection failed"}), 500

        cursor = conn.cursor()
        cursor.execute(
            """
            INSERT INTO devices
            (name, location, device_type, camera_index, usb_port, ip_address, port, username, password, rtsp_path)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
            """,
            (name, location, device_type, camera_index, usb_port, ip_address, port, username, password, rtsp_path),
        )
        conn.commit()
        device_id = cursor.lastrowid
        conn.close()

        print(f"[INFO] Device added: {name} (ID={device_id})")

        return jsonify({
            "id": device_id,
            "name": name,
            "location": location,
            "device_type": device_type,
            "camera_index": camera_index,
            "ip_address": ip_address,
            "port": port,
            "username": username,
            "password": password,
            "rtsp_path": rtsp_path,
            "status": "offline",
        }), 201

    except Exception as e:
        print("[ERROR] Failed to add device:", e)
        traceback.print_exc()
        return jsonify({"error": str(e)}), 500

# === GET DEVICES WITH STATUS ===
@app.route("/devices", methods=["GET"])
def get_devices():
    try:
        devices = get_all_devices()
        devices_with_status = []

        for d in devices:
            status = "offline"
            try:
                if d["device_type"] == "USB":
                    cam_index = int(d.get("usb_port") or d.get("camera_index") or 0)
                    cap = cv2.VideoCapture(cam_index, cv2.CAP_DSHOW)
                    if cap.isOpened():
                        status = "online"
                    cap.release()
                else:
                    ip = d.get("ip_address")
                    port = d.get("port")
                    username = d.get("username")
                    password = d.get("password")
                    auth_prefix = f"{username}:{password}@" if username and password else ""
                    if d.get("rtsp_path"):
                        rtsp_path = d["rtsp_path"]
                        source = f"rtsp://{auth_prefix}{ip}:{port}/{rtsp_path}" if port else f"rtsp://{auth_prefix}{ip}/{rtsp_path}"
                    else:
                        source = f"http://{auth_prefix}{ip}:{port}/video" if port else f"http://{auth_prefix}{ip}/video"
                    cap = cv2.VideoCapture(source)
                    if cap.isOpened():
                        status = "online"
                    cap.release()
            except Exception as e:
                print(f"[WARN] Could not check status for {d.get('name')}: {e}")

            d["status"] = status
            devices_with_status.append(d)

        return jsonify(devices_with_status)
    except Exception as e:
        print("[ERROR] Failed to fetch devices:", e)
        traceback.print_exc()
        return jsonify([]), 500

def gen_frames(device):
    global recognizer, label_names

    def open_camera(device):
        try:
            if device["device_type"] == "USB":
                index = int(device.get("usb_port") or device.get("camera_index") or 0)
                cap = cv2.VideoCapture(index, cv2.CAP_DSHOW)
            else:
                ip = device.get("ip_address")
                port = device.get("port")
                username = device.get("username")
                password = device.get("password")
                auth = f"{username}:{password}@" if username and password else ""
                path = device.get("rtsp_path")
                if path:
                    cap = cv2.VideoCapture(f"rtsp://{auth}{ip}:{port}/{path}" if port else f"rtsp://{auth}{ip}/{path}")
                else:
                    cap = cv2.VideoCapture(f"http://{auth}{ip}:{port}/video" if port else f"http://{auth}{ip}/video")
            if not cap.isOpened():
                print(f"[WARN] Camera cannot be opened for device {device.get('name')}")
                return None
            return cap
        except Exception as e:
            print(f"[ERROR] Opening camera for {device.get('name')}: {e}")
            return None

    cam = open_camera(device)
    last_logged = {}

    while True:
        if cam is None or not cam.isOpened():
            print(f"[WARN] Retrying camera for {device.get('name')} in 5s...")
            time.sleep(5)
            cam = open_camera(device)
            continue

        success, frame = cam.read()
        if not success or frame is None:
            print(f"[WARN] Lost feed for {device.get('name')} - reopening camera")
            try: cam.release()
            except: pass
            cam = open_camera(device)
            time.sleep(3)
            continue

        try:
            gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
            faces = face_detector.detectMultiScale(gray, 1.2, 5, minSize=(100, 100))

            with recognizer_lock:
                current_recognizer = recognizer
                current_labels = label_names.copy()

            for (x, y, w, h) in faces:
                try:
                    id_, confidence = current_recognizer.predict(gray[y:y+h, x:x+w])
                    confidence_val = max(0, min(100, round(100 - confidence)))

                    if confidence < 60:
                        name = current_labels.get(id_, f"User_{id_}")
                        now = time.time()

                        # Only log if 10s passed since last log for this face
                        if name not in last_logged or now - last_logged[name] > 10:
                            log_data = {
                                "account_id": device["id"],  # correct device ID
                                "name": name,
                                "confidence": confidence_val
                            }

                            # Debug print before sending
                            print(f"[DEBUG] Sending log: {log_data}")

                            try:
                                response = requests.post(
                                    "http://localhost/cctv_system/backend/log_face.php",
                                    json=log_data,
                                    timeout=3
                                )
                                print(f"[DEBUG] HTTP response: {response.status_code} | {response.text}")

                                if response.status_code != 200:
                                    print(f"[WARN] Logging failed for {name}, status {response.status_code}")

                                last_logged[name] = now

                            except Exception as e:
                                print(f"[ERROR] Exception during logging for {name}: {e}")
                                # Fallback: log to local file
                                with open("face_log_debug.txt", "a") as f:
                                    f.write(f"{time.time()} - DEVICE {device['id']} - {name} - {confidence_val}\n")
                                print(f"[INFO] Logged to local file as fallback for {name}")

                        color = (0, 255, 0)
                        label_text = f"{name} ({confidence_val}%)"
                    else:
                        color = (0, 0, 255)
                        label_text = "Unknown"

                    cv2.rectangle(frame, (x, y), (x+w, y+h), color, 2)
                    cv2.putText(frame, label_text, (x+5, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, color, 2)

                except Exception as e:
                    print(f"[ERROR] Face prediction error: {e}")

            _, buffer = cv2.imencode(".jpg", frame)
            yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")

        except Exception as e:
            print(f"[ERROR] Frame processing error: {e}")


# === VIDEO FEED ROUTE ===
@app.route("/video_feed/<int:device_id>")
def video_feed(device_id):
    try:
        conn = get_db_connection()
        if not conn:
            return Response("DB connection failed", status=500)
        cursor = conn.cursor(dictionary=True)
        cursor.execute("SELECT * FROM devices WHERE id = %s", (device_id,))
        device = cursor.fetchone()
        cursor.close()
        conn.close()
        if not device:
            return jsonify({"error": "Device not found"}), 404
        return Response(gen_frames(device), mimetype="multipart/x-mixed-replace; boundary=frame")
    except Exception as e:
        print(f"[ERROR] video_feed exception for device {device_id}: {e}")
        return Response("Internal server error", status=500)

# === STATUS ROUTE ===
@app.route("/")
def index():
    return jsonify({
        "status": "running",
        "message": "Face recognition stream active",
        "trainer_exists": os.path.exists(TRAINER_PATH),
        "labels_exists": os.path.exists(LABELS_PATH),
        "total_labels": len(label_names),
    })

if __name__ == "__main__":
    print("[INFO] Starting Face Recognition Stream at http://localhost:5000")
    app.run(host="0.0.0.0", port=5000, debug=False)
