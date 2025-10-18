# 🛡️ SafeSync CCTV System
An integrated surveillance system using **React (frontend)**, **PHP (XAMPP backend)**, and **Flask (Python services)** for **real-time face recognition**, **CCTV monitoring**, and **SOS alerts**.

---

Prerequisites

Before setting up the SafeSync CCTV System, make sure you have the following installed on your computer:

Python 3.11 – required for running the Flask backends and face recognition modules.

XAMPP (latest version) – used to host the PHP backend and MySQL database.

Node.js (version 18 or newer) – required for running the React frontend.

Git (optional) – recommended for version control and easy updates.

---

## Python Environment Setup

### 1 Create & Activate Virtual Environment  
#### On Windows
```bash
cd backend
py -3.11 -m venv venv
venv\Scripts\activate
```

#### On Linux/macOS
```bash
cd backend
python3.11 -m venv venv
source venv/bin/activate
```

---

### 2 Install Dependencies
Install all necessary Python libraries:

```bash
pip install -r requirements.txt
```

**Final `requirements.txt`:**
```txt
flask
flask-cors
flask-socketio
werkzeug
mysql-connector-python
opencv-contrib-python
numpy
pillow
requests
eventlet
```

---

## PHP Backend Setup (XAMPP)
1. Install **XAMPP** and open **XAMPP Control Panel**.  
2. Ensure **Apache** and **MySQL** are running.  
3. Place your project’s PHP folder in:
   ```
   C:\xampp\htdocs\cctv_system\
   ```
4. Inside it, your backend should be at:
   ```
   C:\xampp\htdocs\cctv_system\backend\
   ```
5. Test PHP by visiting:  
   [http://localhost/cctv_system/backend](http://localhost/cctv_system/backend)

---

### PHPMailer Setup (for Forgot Password)
If the `vendor` folder is missing, install PHPMailer using Composer:

```bash
cd backend
composer install
```
or
```bash
composer require phpmailer/phpmailer
```
This generates the `vendor` folder required for sending email codes in the Forgot Password feature.

---

## Database Setup
1. Open **phpMyAdmin** (usually at [http://localhost/phpmyadmin](http://localhost/phpmyadmin)).  
2. Create a new database named:
   ```
   cctv_system
   ```
3. Import your `.sql` schema file (without `INSERT` data if testing).  
4. Update your PHP backend’s `config.php` with:
   ```php
   <?php
   $conn = new mysqli("localhost", "root", "", "cctv_system");
   if ($conn->connect_error) {
       die("Connection failed: " . $conn->connect_error);
   }
   ?>
   ```

---

## Frontend Setup (React)
1. Open your frontend folder:
   ```bash
   cd frontend
   npm install
   ```
2. Start development server:
   ```bash
   npm start
   ```
3. Default URL:  
   [http://localhost:3000](http://localhost:3000)

---

## Auto-Start (Windows)
Use the provided **`start_cctv_system.bat`** script to launch all modules automatically.

### 🔹 It does the following:
1. Starts **XAMPP** (Apache + MySQL)  
2. Runs Flask servers:
   - `face_recognition_stream.py` → port **5000**
   - `camera_server.py` → port **5001**
   - `sos_server.py` → port **5002**
3. Starts **React frontend** on port **3000**
4. Verifies all services and prints status summary.

### Usage
Simply double-click:
```
start_cctv_system.bat
```

You should see:
```
Face Recognition Stream running (port 5000)
Camera Server running (port 5001)
SOS Server running (port 5002)
React Frontend: http://localhost:3000
PHP Backend: http://localhost/cctv_system/backend
```

---

## Access Points
Once the system is running, you can access each part using the following URLs:

React Frontend (Main Interface):
http://localhost:3000

PHP Backend (User & Account Management):
http://localhost/cctv_system/backend

Flask – Face Recognition Stream (Port 5000):
http://localhost:5000

Flask – Camera Server (Live Stream):
http://localhost:5001/video_feed

Flask – SOS Alert Service (Socket.IO Alerts):
http://localhost:5002

---

## Face Recognition Setup
To enroll and train new faces:

1. **Capture Dataset**
   ```bash
   python 1_capture_dataset.py
   ```
   ➤ This collects face samples and saves them under `dataset/`.

2. **Train Classifier**
   ```bash
   python 2_train_classifier.py
   ```
   ➤ Generates `trainer.yml` used for recognition.

3. **Test Recognition**
   ```bash
   python 3_face_recognition.py
   ```

---

## Notes
- Each Flask server runs in its **own terminal window**.  
- Stop any service using **Ctrl + C**.  
- Ensure **MySQL service is active** before launching the batch file.  
- Keep `venv` path consistent in `start_cctv_system.bat`.

---

## Troubleshooting
If you encounter issues while running the system, try the following fixes:

ModuleNotFoundError:
→ Run pip install -r requirements.txt again to reinstall missing dependencies.

Flask port conflict:
→ Close any open Flask windows or modify the port numbers in your .py files.

MySQL connection error:
→ Double-check your database credentials in config.php and your Flask database connection settings.

Webcam not detected:
→ Ensure camera permissions are enabled and OpenCV is properly installed.

React not loading:
→ Run npm install to reinstall frontend dependencies, then npm start again.
---

## License
This project is part of **SafeSync CCTV System**.  
Developed for educational and deployment use within local networks.
