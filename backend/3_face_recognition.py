import cv2
import numpy as np
import mysql.connector
import requests
import json
import time
import os
import sys

# === PATH SETUP ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
TRAINER_PATH = os.path.join(BASE_DIR, "trainer", "trainer.yml")
CASCADE_PATH = os.path.join(BASE_DIR, "haarcascade", "haarcascade_frontalface_default.xml")

# === LOAD HAAR CASCADE ===
if not os.path.exists(CASCADE_PATH):
    print(f"[ERROR] Haarcascade not found: {CASCADE_PATH}")
    sys.exit(1)
face_cascade = cv2.CascadeClassifier(CASCADE_PATH)

# === LOAD RECOGNIZER ===
def load_recognizer():
    recognizer = cv2.face.LBPHFaceRecognizer_create()
    recognizer.read(TRAINER_PATH)
    return recognizer

if not os.path.exists(TRAINER_PATH):
    print("[WARN] No trained model found. Please run 2_train_classifier.py first.")
    sys.exit(1)

recognizer = load_recognizer()
last_trainer_mtime = os.path.getmtime(TRAINER_PATH)
print(f"[INFO] Loaded model: {TRAINER_PATH}")

# === DATABASE CONNECTION ===
def connect_db():
    try:
        db = mysql.connector.connect(
            host="localhost",
            user="root",
            password="",
            database="cctv_system",
            connection_timeout=10,
            auth_plugin='mysql_native_password'
        )
        return db
    except Exception as e:
        print("[ERROR] Database connection failed:", e)
        return None

db = connect_db()
if db is None:
    sys.exit(1)
cursor = db.cursor()

# === FACE INFO LOOKUP ===
def get_face_info(face_id):
    try:
        cursor.execute("SELECT user_id, name FROM faces WHERE user_id = %s ORDER BY id DESC LIMIT 1", (face_id,))
        result = cursor.fetchone()
        if result:
            account_id, name = result
            return account_id, name
    except Exception as e:
        print("[DB ERROR] get_face_info:", e)
    return None, f"Unknown_{face_id}"

# === LOGGING FUNCTION ===
def log_face_detection(account_id, name, confidence):
    url = "http://localhost/cctv_system/backend/log_face.php"
    payload = {"account_id": account_id, "name": name, "confidence": confidence}
    headers = {"Content-Type": "application/json"}

    try:
        response = requests.post(url, data=json.dumps(payload), headers=headers, timeout=5)
        if response.ok:
            try:
                res_json = response.json()
                print(f"[LOGGED] {name} ({confidence}%) → {res_json.get('status', 'unknown')}")
            except ValueError:
                print(f"[WARN] Logged {name} ({confidence}%), invalid JSON from backend.")
        else:
            print(f"[ERROR] Logging HTTP {response.status_code}: {response.text}")
    except Exception as e:
        print("[ERROR] log_face_detection:", e)

# === CAMERA INITIALIZATION ===
cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
if not cap.isOpened():
    print("[ERROR] Unable to access camera.")
    sys.exit(1)

print("[INFO] 🎥 Starting real-time face recognition... (Press 'q' to quit)")
last_logged = {}

# === MAIN LOOP ===
while True:
    # Auto-reload if trainer.yml updated
    try:
        current_mtime = os.path.getmtime(TRAINER_PATH)
        if current_mtime != last_trainer_mtime:
            print("\n[UPDATE] Detected updated model file. Reloading trainer.yml...\n")
            recognizer = load_recognizer()
            last_trainer_mtime = current_mtime
            print("[INFO] Model reloaded successfully.")
    except FileNotFoundError:
        print("[WARN] trainer.yml missing. Waiting for retrain...")
        time.sleep(3)
        continue

    ret, frame = cap.read()
    if not ret:
        print("[WARN] Camera read failed. Retrying...")
        time.sleep(1)
        continue

    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, scaleFactor=1.3, minNeighbors=5)

    for (x, y, w, h) in faces:
        roi_gray = gray[y:y+h, x:x+w]
        color = (0, 0, 255)
        name = "Unknown"
        confidence_value = 0

        try:
            face_id, confidence = recognizer.predict(roi_gray)
            confidence_value = round(100 - confidence)

            if confidence < 60:
                account_id, name = get_face_info(face_id)
                color = (0, 255, 0)
                label = f"{name} ({confidence_value}%)"

                now = time.time()
                if account_id and (account_id not in last_logged or now - last_logged[account_id] > 5):
                    log_face_detection(account_id, name, confidence_value)
                    last_logged[account_id] = now

                print(f"[DETECTED] {label}")
            else:
                label = f"Unknown ({confidence_value}%)"

        except Exception as e:
            print("[ERROR] Prediction failed:", e)
            label = "Recognition Error"

        cv2.rectangle(frame, (x, y), (x + w, y + h), color, 2)
        cv2.putText(frame, label, (x, y - 10), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)

    cv2.imshow("Face Recognition", frame)

    if cv2.waitKey(1) & 0xFF == ord('q'):
        break

cap.release()
cv2.destroyAllWindows()
cursor.close()
db.close()
print("[INFO] Recognition stopped and resources released.")
