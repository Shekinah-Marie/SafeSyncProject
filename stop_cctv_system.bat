@echo off
title SafeSync CCTV System - Stop All Services
color 0C

echo =====================================================
echo        Stopping SafeSync CCTV System Services
echo =====================================================
echo.

:: --- 1. Close Flask and React windows by title (properly quoted) ---
echo [1/7] Closing Flask and React console windows...
for %%T in (
    "Flask - Face Recognition (port 5000)"
    "Flask - Camera Server (port 5001)"
    "Flask - SOS Server (port 5002)"
    "React Frontend (port 3000)"
) do (
    powershell -NoProfile -Command ^
        "Get-Process | Where-Object { $_.MainWindowTitle -eq '%%~T' } | ForEach-Object { Stop-Process -Id $_.Id -Force }"
)
timeout /t 1 >nul

:: --- 2. Stop Flask servers via ports ---
echo [2/7] Ensuring Flask servers (ports 5000–5002) are terminated...
for %%p in (5000 5001 5002) do (
    powershell -NoProfile -Command ^
        "Get-NetTCPConnection -LocalPort %%p -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
)
timeout /t 1 >nul

:: --- 3. Stop React frontend via port 3000 ---
echo [3/7] Stopping React frontend (port 3000)...
powershell -NoProfile -Command ^
    "Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }"
timeout /t 1 >nul

:: --- 4. Stop XAMPP Services ---
echo [4/7] Stopping XAMPP (Apache ^& MySQL)...
taskkill /IM "httpd.exe" /F >nul 2>&1
taskkill /IM "mysqld.exe" /F >nul 2>&1
taskkill /IM "xampp-control.exe" /F >nul 2>&1
timeout /t 1 >nul

:: --- 5. Cleanup Python and Node processes ---
echo [5/7] Cleaning up background Python and Node processes...
taskkill /IM "python.exe" /F >nul 2>&1
taskkill /IM "pythonw.exe" /F >nul 2>&1
taskkill /IM "node.exe" /F >nul 2>&1
taskkill /IM "npm.exe" /F >nul 2>&1
timeout /t 1 >nul

:: --- 6. Extra cleanup for leftover cmd windows (pattern match) ---
echo [6/7] Closing leftover cmd windows from startup...
powershell -NoProfile -Command ^
    "Get-Process cmd | Where-Object { $_.MainWindowTitle -match 'Flask|React' } | ForEach-Object { Stop-Process -Id $_.Id -Force }"
timeout /t 1 >nul

:: --- 7. Summary ---
echo [7/7] ✅ All SafeSync CCTV components have been stopped and windows closed.
echo -----------------------------------------------------
echo • Flask Servers (5000, 5001, 5002)
echo • React Frontend (3000)
echo • Apache & MySQL (XAMPP)
echo -----------------------------------------------------
echo 🧹 All related console windows were closed automatically.
echo =====================================================

pause
exit
