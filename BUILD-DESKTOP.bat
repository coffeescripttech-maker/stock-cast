@echo off
title Ruiz Store POS - Build Desktop App
cd /d "%~dp0"

echo ================================================
echo  Ruiz Store POS - Building Desktop App
echo ================================================
echo.

echo Building frontend and backend...
npm run dist

echo.
echo ================================================
echo  Build complete!
echo  Check the 'release' folder for the installer.
echo ================================================
pause
