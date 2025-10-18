import subprocess
import time
import os

# === Get backend directory ===
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# === Paths to backend Python scripts ===
APP_SCRIPT = os.path.join(BASE_DIR, "app.py")               # Main Flask API (port 5000)
CAMERA_SCRIPT = os.path.join(BASE_DIR, "camera_server.py")  # Camera / Enrollment (port 5001)
SOS_SCRIPT = os.path.join(BASE_DIR, "sos_server.py")        # SOS Alert Server (port 5002)


def run_script(script_path, name):
    """Start a Python backend script in a separate process"""
    print(f" Starting {name}...")
    return subprocess.Popen(["python", script_path], shell=True)


if __name__ == "__main__":
    print("===================================")
    print("   CCTV System Backend Launcher")
    print("===================================")

    # Start Flask services
    app_process = run_script(APP_SCRIPT, "Flask Main API (port 5000)")
    time.sleep(2)

    camera_process = run_script(CAMERA_SCRIPT, "Camera / Enrollment Server (port 5001)")
    time.sleep(2)

    sos_process = run_script(SOS_SCRIPT, "SOS Server (port 5002)")
    time.sleep(2)

    print("\nAll backend services started successfully.")
    print("Main Flask API:   http://localhost:5000")
    print("Camera Server:    http://localhost:5001")
    print("SOS Server:       http://localhost:5002")
    print("Press Ctrl + C to stop all services.\n")

    try:
        # Keep all processes running
        app_process.wait()
        camera_process.wait()
        sos_process.wait()
    except KeyboardInterrupt:
        print("\n Shutting down services...")
        app_process.terminate()
        camera_process.terminate()
        sos_process.terminate()
        print(" All backend services stopped.")
