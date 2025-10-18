import cv2
import os
import numpy as np
from PIL import Image
import mysql.connector
import time
import sys
import json   # === NEW ===

# === PATH SETUP ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATASET_PATH = os.path.join(BASE_DIR, "dataset")
TRAINER_DIR = os.path.join(BASE_DIR, "trainer")
os.makedirs(TRAINER_DIR, exist_ok=True)
TRAINER_FILE = os.path.join(TRAINER_DIR, "trainer.yml")
LABELS_FILE = os.path.join(TRAINER_DIR, "labels.json")  # === NEW ===

# === DATABASE CONNECTION ===
try:
    db = mysql.connector.connect(
        host="localhost",
        user="root",
        password="",  # default for XAMPP
        database="cctv_system",
        connection_timeout=10,
        auth_plugin='mysql_native_password'
    )
    cursor = db.cursor()
    print("[INFO] Connected to MySQL successfully.")
except Exception as e:
    print("[ERROR] Failed to connect to database:", e)
    sys.exit(1)

# === LOAD FACE RECORDS FROM DATABASE ===
try:
    cursor.execute("SELECT user_id, name, image_path FROM faces ORDER BY user_id ASC")
    faces_db = cursor.fetchall()
except Exception as e:
    print("[ERROR] Failed to load face data from database:", e)
    db.close()
    sys.exit(1)

if not faces_db:
    print("[WARN] No face records found in database. Nothing to train.")
    db.close()
    sys.exit(1)

# === SETUP FACE DETECTOR & RECOGNIZER ===
recognizer = cv2.face.LBPHFaceRecognizer_create()
cascade_path = os.path.join(BASE_DIR, "haarcascade", "haarcascade_frontalface_default.xml")

if not os.path.exists(cascade_path):
    print(f"[ERROR] Haarcascade not found at {cascade_path}")
    db.close()
    sys.exit(1)

detector = cv2.CascadeClassifier(cascade_path)
if detector.empty():
    print("[ERROR] Haarcascade failed to load.")
    db.close()
    sys.exit(1)

face_samples = []
ids = []
label_map = {}  # === NEW ===

print(f"[INFO] Found {len(faces_db)} face entries. Processing images...\n")

# === PROCESS EACH RECORD ===
for user_id, name, image_path in faces_db:
    abs_img_path = os.path.join(BASE_DIR, image_path.replace("../", "").replace("../../", ""))

    if not os.path.exists(abs_img_path):
        print(f"[WARN] Missing image file: {abs_img_path}")
        continue

    try:
        img = Image.open(abs_img_path).convert("L")  # grayscale
        img_np = np.array(img, "uint8")
        faces = detector.detectMultiScale(img_np, scaleFactor=1.2, minNeighbors=5)

        if len(faces) == 0:
            print(f"[WARN] No face detected in {abs_img_path}")
            continue

        for (x, y, w, h) in faces:
            face_samples.append(img_np[y:y + h, x:x + w])
            ids.append(user_id)

        # === NEW === store name mapping for recognition display
        label_map[user_id] = name

    except Exception as e:
        print(f"[ERROR] Failed processing {abs_img_path}: {e}")

# === TRAIN AND SAVE MODEL ===
if len(face_samples) == 0:
    print("[WARN] No valid faces detected. Training aborted.")
    cursor.close()
    db.close()
    sys.exit(1)

print(f"[INFO] Training {len(set(ids))} unique users with {len(face_samples)} samples...")
recognizer.train(face_samples, np.array(ids))
recognizer.save(TRAINER_FILE)
print(f"[SUCCESS] Training complete — model saved as {TRAINER_FILE}")
print(f"[INFO] Total trained faces: {len(face_samples)}")

# === SAVE LABEL MAPPING (user_id → name) ===
try:
    with open(LABELS_FILE, "w", encoding="utf-8") as f:
        json.dump(label_map, f, indent=4, ensure_ascii=False)
    print(f"[INFO] Label map saved to {LABELS_FILE}")
except Exception as e:
    print(f"[ERROR] Failed to save label map: {e}")

# === CLEANUP ===
cursor.close()
db.close()

print("[DONE] Training script finished at", time.strftime("%Y-%m-%d %H:%M:%S"))
sys.exit(0)
