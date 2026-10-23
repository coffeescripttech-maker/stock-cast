@echo off
title StockCast - Desktop App
cd /d "%~dp0"

echo ================================================
echo  StockCast - Starting Desktop App
echo ================================================
echo.

echo [1/2] Killing existing processes on ports 3001, 3005, 5173 and 5174...
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3001 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :3005 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5173 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
for /f "tokens=5" %%a in ('netstat -ano ^| findstr :5174 ^| findstr LISTENING') do taskkill /F /PID %%a 2>nul
echo Done cleaning ports.
echo.

echo [2/2] Starting Server, Client ^& Electron...
call npm run electron:dev

echo.
echo ================================================
echo  StockCast is closing...
echo ================================================
pause
