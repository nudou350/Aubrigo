@echo off
echo ========================================
echo    Aubrigo - Starting Application
echo ========================================
echo.

REM Check if node_modules exists
if not exist "node_modules\" (
    echo Installing root dependencies...
    call npm install
    echo.
)

REM Check if backend dependencies are installed
if not exist "backend\node_modules\" (
    echo Installing backend dependencies...
    cd backend
    call npm install
    cd ..
    echo.
)

REM Check if frontend dependencies are installed
if not exist "frontend\node_modules\" (
    echo Installing frontend dependencies...
    cd frontend
    call npm install
    cd ..
    echo.
)

echo Starting backend and frontend...
echo.
echo Backend will run on: http://localhost:3000
echo Frontend will run on: http://localhost:4200
echo.

REM Start both services
start "Aubrigo Backend" cmd /k "cd backend && npm run start:dev"
timeout /t 2 /nobreak > nul
start "Aubrigo Frontend" cmd /k "cd frontend && npm start"

echo.
echo Both services are starting in separate windows...
echo Close this window or press Ctrl+C to stop monitoring.
echo.
