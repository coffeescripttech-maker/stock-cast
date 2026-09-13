@echo off
title Ruiz Store POS - Desktop App
cd /d "%~dp0"

echo ================================================
echo  Ruiz Store POS - Starting Desktop App
echo ================================================
echo.

echo [1/2] Killing existing processes on ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo Done cleaning ports.
echo.

echo [2/2] Starting Server, Client & Electron...
call npm run electron:dev

echo.
echo ================================================
echo  Ruiz Store POS is closing...
echo ================================================
pause
