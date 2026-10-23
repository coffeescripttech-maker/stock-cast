@echo off
title StockCast - Build Desktop App
cd /d "%~dp0"

echo ================================================
echo  StockCast - Building Desktop App
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
