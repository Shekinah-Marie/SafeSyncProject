import cv2
import os
import numpy as np
from PIL import Image

# Load Haar Cascade
face_cascade = cv2.CascadeClassifier(cv2.data.haarcascades + 'haarcascade_frontalface_default.xml')

# Load recognizer if trainer exists
recognizer = cv2.face.LBPHFaceRecognizer_create()
if os.path.exists('trainer/trainer.yml'):
    recognizer.read('trainer/trainer.yml')
else:
    recognizer = None

# Create dataset folder if not exists
if not os.path.exists('dataset'):
    os.makedirs('dataset')

# Get user ID
user_id = input("Enter user ID (from database): ")
user_name = input("Enter name: ")

cap = cv2.VideoCapture(0, cv2.CAP_DSHOW)
print("[INFO] Starting face capture. Look at the camera and wait...")

count = 0
duplicate_detected = False

while True:
    ret, frame = cap.read()
    gray = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY)
    faces = face_cascade.detectMultiScale(gray, 1.3, 5)

    for (x, y, w, h) in faces:
        face = gray[y:y+h, x:x+w]

        # Check for duplicate if recognizer is available
        if recognizer is not None:
            try:
                id_, confidence = recognizer.predict(face)
                if confidence < 55:  
                    print(f"[WARNING] This face already exists (Matched ID: {id_}, Confidence: {round(100 - confidence)}%)")
                    duplicate_detected = True
                    break
            except Exception as e:
                pass

        # Save new face if not duplicate
        if not duplicate_detected:
            count += 1
            cv2.imwrite(f"dataset/User.{user_id}.{count}.jpg", face)
            cv2.rectangle(frame, (x, y), (x+w, y+h), (0, 255, 0), 2)
            cv2.putText(frame, f"Capturing {count}/50", (x, y-10), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0,255,0), 2)

    cv2.imshow('Face Enrollment', frame)

    if duplicate_detected:
        print("[INFO] Enrollment stopped — face already exists.")
        break

    if cv2.waitKey(1) & 0xFF == ord('q') or count >= 50:
        break

cap.release()
cv2.destroyAllWindows()

if not duplicate_detected and count > 0:
    print("[INFO] Dataset created successfully.")
elif duplicate_detected:
    for f in os.listdir('dataset'):
        if f.startswith(f"User.{user_id}."):
            os.remove(os.path.join('dataset', f))
    print("[INFO] Duplicate face entry discarded.")
