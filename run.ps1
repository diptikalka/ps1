# PowerShell Launcher for AI-Driven Hyper-Local Early Warning System
Set-Location $PSScriptRoot
$env:Path = "C:\Users\LENOVO\AppData\Local\Python\bin;" + $env:Path

Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host " AI-Driven Hyper-Local Early Warning System (Enterprise MVP)" -ForegroundColor Yellow
Write-Host "=========================================================================" -ForegroundColor Cyan
Write-Host "Starting Flask backend server on http://127.0.0.1:5000 ..." -ForegroundColor Green
Write-Host ""

if (Test-Path "C:\Users\LENOVO\AppData\Local\Python\bin\python.exe") {
    & "C:\Users\LENOVO\AppData\Local\Python\bin\python.exe" backend/app.py
} else {
    & python backend/app.py
}
