@echo off
cd /d "%~dp0"
set PATH=C:\Users\LENOVO\AppData\Local\Python\bin;C:\Users\LENOVO\AppData\Local\Microsoft\WindowsApps;%PATH%

echo =========================================================================
echo  AI-Driven Hyper-Local Early Warning System (Enterprise MVP)
echo =========================================================================
echo Starting Flask backend server on http://127.0.0.1:5000 ...
echo.

if exist "C:\Users\LENOVO\AppData\Local\Python\bin\python.exe" (
    "C:\Users\LENOVO\AppData\Local\Python\bin\python.exe" backend\app.py
) else (
    python backend\app.py
)

pause
