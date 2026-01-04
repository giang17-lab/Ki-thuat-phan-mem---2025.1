@echo off
REM Script setup database cho Blue Moon

echo.
echo ========================================
echo   Blue Moon - Database Setup
echo ========================================
echo.

cd /d "%~dp0"

echo [1/4] Creating database schema...
node seed-data.js
if errorlevel 1 (
  echo Failed to seed data
  exit /b 1
)

echo.
echo [2/4] Creating request tables and seed data...
node seed-requests.js
if errorlevel 1 (
  echo Failed to seed requests
  exit /b 1
)

echo.
echo ========================================
echo   ✅ Setup completed successfully!
echo ========================================
echo.
echo Database: blue_moon_db
echo Host: localhost:3306
echo.
echo To start backend:
echo   npm start
echo.
echo To start frontend:
echo   cd ../blue-moon-fe
echo   npm run dev
echo.
pause
