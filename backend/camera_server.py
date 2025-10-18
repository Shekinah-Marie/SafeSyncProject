from flask import Flask, Response, jsonify, request, make_response
from flask_cors import CORS
import cv2
import numpy as np
import mysql.connector
import requests
import json
import time
import os
import sys
import base64
import threading
import subprocess  

app = Flask(__name__)
CORS(app, resources={r"/*": {"origins": "*"}}, supports_credentials=True)

@app.before_request
def handle_preflight():
    """Ensure OPTIONS requests always return HTTP 200 with CORS headers"""
    if request.method == "OPTIONS":
        response = make_response()
        response.status_code = 200
        response.headers.add("Access-Control-Allow-Origin", "http://localhost:3000")
        response.headers.add("Access-Control-Allow-Headers", "Content-Type,Authorization")
        response.headers.add("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        response.headers.add("Access-Control-Allow-Credentials", "true")
        return response

# === Path Setup ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINER_PATH = os.path.join(BASE_DIR, "trainer", "trainer.yml")
CASCADE_PATH = os.path.join(BASE_DIR, "haarcascade", "haarcascade_frontalface_default.xml")
DATASET_DIR = os.path.join(BASE_DIR, "dataset")

# === Ensure folders exist ===
os.makedirs(DATASET_DIR, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, "trainer"), exist_ok=True)

# === Initialize Haar Cascade ===
if not os.path.exists(CASCADE_PATH):
    print(f"[ERROR] Haarcascade not found: {CASCADE_PATH}")
    sys.exit(1)
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# === Load Recognizer ===
try:
    recognizer = cv2.face.LBPHFaceRecognizer_create()
except AttributeError:
    print("[ERROR] Missing OpenCV contrib module. Run: pip install opencv-contrib-python")
    sys.exit(1)

MODEL_LOADED = False
def load_recognizer():
    global recognizer, MODEL_LOADED
    try:
        recognizer.read(TRAINER_PATH)
        MODEL_LOADED = True
        print("[INFO] Model reloaded successfully.")
        return True
    except Exception as e:
        print("[WARN] No trained model found or failed to load:", e)
        MODEL_LOADED = False
        return False

if os.path.exists(TRAINER_PATH):
    load_recognizer()
else:
    print("[WARN] Trainer not found — model not yet trained.")

# === Database Connection ===
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",
        database="cctv_system",
        connection_timeout=10,
        auth_plugin="mysql_native_password"
    )
    cursor = db.cursor()
    print("[INFO] Connected to database successfully.")
except Exception as e:
    print("[ERROR] Database connection failed:", e)
    sys.exit(1)

# === Helpers ===
def get_face_name(face_id):
    try:
        cursor.execute("SELECT name FROM faces WHERE user_id = %s ORDER BY id DESC LIMIT 1", (face_id,))
        result = cursor.fetchone()
        return (result[0], face_id) if result else (f"User_{face_id}", face_id)
    except Exception as e:
        print(f"[DB ERROR] {e}")
        return f"User_{face_id}", face_id

def log_face_detection(account_id, name, confidence):
    url = "http://localhost/cctv_system/backend/log_face.php"
    payload = {"account_id": account_id, "name": name, "confidence": confidence}
    try:
        requests.post(url, data=json.dumps(payload), headers={"Content-Type": "application/json"}, timeout=5)
    except Exception as e:
        print("[ERROR] log_face_detection:", e)

def decode_base64_image(data_url):
    try:
        header, encoded = data_url.split(",", 1)
    except ValueError:
        encoded = data_url
    image_bytes = base64.b64decode(encoded)
    np_arr = np.frombuffer(image_bytes, np.uint8)
    return cv2.imdecode(np_arr, cv2.IMREAD_COLOR)

def extract_largest_face_gray(frame):
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.2, minNeighbors=5, minSize=(80, 80))
    if len(faces) == 0:
        return None
    (x, y, w, h) = sorted(faces, key=lambda r: r[2] * r[3], reverse=True)[0]
    return gray[y:y + h, x:x + w]

def hist_similarity(gray1, gray2):
    try:
        s1, s2 = cv2.resize(gray1, (120, 120)), cv2.resize(gray2, (120, 120))
        h1, h2 = cv2.calcHist([s1], [0], None, [256], [0, 256]), cv2.calcHist([s2], [0], None, [256], [0, 256])
        cv2.normalize(h1, h1)
        cv2.normalize(h2, h2)
        return cv2.compareHist(h1, h2, cv2.HISTCMP_CORREL)
    except Exception as e:
        print("[ERROR] hist_similarity:", e)
        return -1

# === Live Video Feed ===
def generate_frames():
    cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
    if not cap.isOpened():
        print("[ERROR] Camera not detected.")
        return
    last_logged = {}
    while True:
        success, frame = cap.read()
        if not success:
            break
        gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
        faces = face_cascade.detectMultiScale(gray, 1.3, 5)
        for (x, y, w, h) in faces:
            roi_gray = gray[y:y + h, x:x + w]
            name, color, label = "Unknown", (0, 0, 255), "Unknown"
            confidence_value = 0
            if MODEL_LOADED:
                try:
                    id_, confidence = recognizer.predict(roi_gray)
                    confidence_value = round(100 - confidence)
                    if confidence < 50:
                        name, user_id = get_face_name(id_)
                        color = (0, 255, 0)
                        label = f"{name} ({confidence_value}%)"
                        now = time.time()
                        if user_id and (user_id not in last_logged or now - last_logged[user_id] > 5):
                            log_face_detection(user_id, name, confidence_value)
                            last_logged[user_id] = now
                    else:
                        label = f"Unknown ({confidence_value}%)"
                except Exception as e:
                    print("[ERROR] Recognition error:", e)
            else:
                label = "Model not trained"
            cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
            cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        _, buffer = cv2.imencode(".jpg", frame)
        yield (b"--frame\r\nContent-Type: image/jpeg\r\n\r\n" + buffer.tobytes() + b"\r\n")
    cap.release()

@app.route("/video_feed")
def video_feed():
    return Response(generate_frames(), mimetype="multipart/x-mixed-replace; boundary=frame")

# === Face Enrollment Endpoint ===
@app.route("/api/enroll_face", methods=["POST", "OPTIONS"])
def enroll_face():
    if request.method == "OPTIONS":
        return jsonify({"status": "ok"}), 200

    try:
        data = request.get_json()
        name = data.get("name")
        contact = data.get("contact")
        user_id = data.get("user_id")  
        image_data = data.get("image")

        # === Validate fields ===
        if not user_id or not name or not image_data:
            return jsonify({"error": "Missing user_id, name, or image."}), 400

        user_id = int(user_id)

        # === Decode uploaded image ===
        frame = decode_base64_image(image_data)
        if frame is None:
            return jsonify({"error": "Invalid image data."}), 400

        gray_new = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)

        # === Check if this user already has a registered face ===
        cursor.execute("SELECT image_path FROM faces WHERE user_id = %s LIMIT 1", (user_id,))
        existing_face = cursor.fetchone()

        if existing_face:
            existing_path = os.path.join(BASE_DIR, existing_face[0].replace("../", "").replace("../../", ""))
            if os.path.exists(existing_path):
                try:
                    stored_img = cv2.imread(existing_path, cv2.IMREAD_GRAYSCALE)
                    if stored_img is not None:
                        sim = hist_similarity(gray_new, stored_img)
                        print(f"[DEBUG] Face similarity score = {sim:.3f}")

                        # === Same person (face re-uploaded) ===
                        if sim > 0.85:
                            return jsonify({
                                "status": "error",
                                "message": "Face already registered."
                            }), 400
                        # === Different person (attempting another face) ===
                        else:
                            return jsonify({
                                "status": "error",
                                "message": "Only one face enrollment per account, create your own account."
                            }), 403
                except Exception as e:
                    print("[ERROR] Face comparison failed:", e)

            # File missing but record exists → block as well
            return jsonify({
                "status": "error",
                "message": "This account already has a face registered."
            }), 403

        # === No existing face: proceed to enroll ===
        user_folder = os.path.join(DATASET_DIR, f"user_{user_id}")
        os.makedirs(user_folder, exist_ok=True)

        filename = f"{int(time.time())}.jpg"
        img_path = os.path.join(user_folder, filename)
        cv2.imwrite(img_path, frame)

        if not os.path.exists(img_path):
            raise Exception("Failed to save image to dataset folder.")

        relative_path = f"dataset/user_{user_id}/{filename}"

        # === Insert new record ===
        cursor.execute(
            "INSERT INTO faces (user_id, name, contact, image_path) VALUES (%s, %s, %s, %s)",
            (user_id, name, contact or "", relative_path)
        )
        db.commit()
        print(f"[SAVED] Face enrolled for account {user_id} ({name}) → {relative_path}")

        # === Retrain model automatically (background thread) ===
        def retrain():
            print("[INFO] Retraining model in background...")
            try:
                result = subprocess.run(
                    [sys.executable, os.path.join(BASE_DIR, "2_train_classifier.py")],
                    capture_output=True, text=True
                )
                print(result.stdout)
                if result.returncode == 0 and os.path.exists(TRAINER_PATH):
                    print("[INFO] Retraining complete — reloading model.")
                    load_recognizer()
                else:
                    print("[ERROR] Retraining failed:", result.stderr)
            except Exception as e:
                print("[ERROR] Retraining thread failed:", e)

        threading.Thread(target=retrain, daemon=True).start()

        return jsonify({
            "status": "success",
            "message": f" Face for {name} enrolled successfully.",
            "user_id": user_id
        }), 200

    except Exception as e:
        print("[ERROR] Enrollment failed:", e)
        return jsonify({"error": str(e)}), 500

@app.route("/")
def index():
    return jsonify({"status": "running", "message": "Camera + Enrollment server active"})

if __name__ == "__main__":
    print("[INFO] Starting Flask camera server at http://localhost:5001")
    app.run(host="0.0.0.0", port=5001, debug=False)
