@echo off
title Ruiz Store POS - Client & Server
cd /d "%~dp0"

echo ================================================
echo  Ruiz Store POS - Starting Client & Server
echo ================================================
echo.

echo [1/3] Killing existing processes on ports 3001 and 5173...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo Done cleaning ports.
echo.

echo [2/3] Starting Server on port 3001...
start "SERVER" cmd /k "cd /d %~dp0server && npm run dev"

echo [3/3] Starting Client on port 5173...
timeout /t 2 /nobreak >nul
start "CLIENT" cmd /k "npm run dev"

echo.
echo ================================================
echo  Both server and client are starting!
echo.
echo  Server:  http://localhost:3001
echo  Client:  http://localhost:5173
echo ================================================
echo.
echo Press any key to exit this window...
pause >nul
