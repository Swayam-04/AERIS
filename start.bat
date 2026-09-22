@echo off
title AERIS - Digital Twin Platform Launcher
color 0B

echo ================================================================
echo               AERIS - Aero-Engine Digital Twin Platform
echo           Real-Time Telemetry & PostgreSQL/TimescaleDB
echo ================================================================
echo.

:: Ensure working directory is the script folder
cd /d "%~dp0"

echo [1/2] Starting Python FastAPI Backend on http://localhost:8000 ...
start "AERIS Backend (FastAPI)" cmd /k "python run_backend.py"

echo [2/2] Starting React Vite Frontend on http://localhost:3000 ...
start "AERIS Frontend (Vite + React)" cmd /k "cd frontend && npm run dev"

echo.
echo ================================================================
echo   Services are launching:
echo   * Web Console:       http://localhost:3000
echo   * Backend REST API:  http://localhost:8000
echo   * API Documentation: http://localhost:8000/docs
echo   * Database Status:   http://localhost:8000/api/database/status
echo ================================================================
echo.
echo Opening browser in 3 seconds...
timeout /t 3 /nobreak >nul
start http://localhost:3000

echo.
echo Both servers are active. Close the respective command windows to stop.
echo Press any key to close this launcher.
pause >nul
