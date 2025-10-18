@echo off
title SafeSync CCTV System - Auto Start
color 0A

echo =====================================================
echo        Starting SafeSync CCTV Face Recognition System
echo =====================================================
echo.

:: --- 1. Start XAMPP (Apache + MySQL) ---
echo [1/6] Starting XAMPP services (Apache & MySQL)...
cd /d "C:\xampp"
if exist "xampp_start.exe" (
    start "" "xampp_start.exe"
) else if exist "xampp-control.exe" (
    start "" "xampp-control.exe"
) else (
    echo [ERROR] XAMPP not found in C:\xampp — please check your installation.
    pause
    exit /b
)
echo Waiting for Apache & MySQL to initialize...
timeout /t 10 >nul

:: --- 2. Set Python Executable Path ---
set "PYTHON_EXE=C:\Users\ASUS\Desktop\CCTV\backend\venv\Scripts\python.exe"
if not exist "%PYTHON_EXE%" (
    echo [ERROR] Python venv not found at:
    echo %PYTHON_EXE%
    echo Please recreate the virtual environment:
    echo   python -m venv venv
    echo   venv\Scripts\activate
    pause
    exit /b
)

:: --- 3. Start Face Recognition Stream (Flask - port 5000) ---
echo [2/6] Starting Flask: Face Recognition Stream (port 5000)...
cd /d "C:\Users\ASUS\Desktop\CCTV\backend"
if exist "face_recognition_stream.py" (
    start "Flask - Face Recognition (port 5000)" cmd /k "%PYTHON_EXE% face_recognition_stream.py"
) else (
    echo [ERROR] face_recognition_stream.py not found in backend folder!
)
timeout /t 7 >nul

:: --- 4. Start Camera Server (Flask - port 5001) ---
echo [3/6] Starting Flask: Camera Server (port 5001)...
if exist "camera_server.py" (
    start "Flask - Camera Server (port 5001)" cmd /k "%PYTHON_EXE% camera_server.py"
) else (
    echo [ERROR] camera_server.py not found in backend folder!
)
timeout /t 7 >nul

:: --- 5. Start SOS Alert Backend (Flask - port 5002) ---
echo [4/6] Starting Flask: SOS Alert Service (port 5002)...
if exist "sos_server.py" (
    start "Flask - SOS Server (port 5002)" cmd /k "%PYTHON_EXE% sos_server.py"
) else (
    echo [ERROR] sos_server.py not found in backend folder!
)
timeout /t 7 >nul

:: --- 6. Verify Flask Server Availability ---
echo [INFO] Verifying Flask servers are running...
powershell -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://localhost:5000' -UseBasicParsing; if ($r.StatusCode -eq 200) { Write-Host '✅ Face Recognition Stream running (port 5000).' } else { Write-Host '⚠️ Face recognition not responding yet.' } } catch { Write-Host '⚠️ Face recognition not responding yet.' }"

powershell -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://localhost:5001' -UseBasicParsing; if ($r.StatusCode -eq 200) { Write-Host '✅ Camera Server running (port 5001).' } else { Write-Host '⚠️ Camera server not responding yet.' } } catch { Write-Host '⚠️ Camera server not responding yet.' }"

powershell -Command ^
  "try { $r = Invoke-WebRequest -Uri 'http://localhost:5002' -UseBasicParsing; if ($r.StatusCode -eq 200) { Write-Host '✅ SOS Server running (port 5002).' } else { Write-Host '⚠️ SOS server not responding yet.' } } catch { Write-Host '⚠️ SOS server not responding yet.' }"
echo.

:: --- 7. Start React Frontend (port 3000) ---
echo [5/6] Starting React Frontend (port 3000)...
cd /d "C:\Users\ASUS\Desktop\CCTV\frontend"
if exist "package.json" (
    start "React Frontend (port 3000)" cmd /k npm start
) else (
    echo [ERROR] React project not found in frontend folder!
)
timeout /t 5 >nul

:: --- 8. Display Status Summary ---
echo.
echo =====================================================
echo ✅ SafeSync CCTV System is now running!
echo -----------------------------------------------------
echo • React Frontend:        http://localhost:3000
echo • PHP Backend (XAMPP):   http://localhost/cctv_system/backend
echo • Face Recognition API:  http://localhost:5000
echo • Camera Stream Server:  http://localhost:5001/video_feed
echo • SOS Alert Service:     http://localhost:5002
echo -----------------------------------------------------
echo ⚙️  Each module runs in its own window — close individually if needed.
echo ⚠️  Press Ctrl + C in any window to stop that specific module.
echo =====================================================

pause
