@echo off
setlocal enabledelayedexpansion

:: ============================================================================
:: PURE REMEDY SOLUTIONS - Video Processor Runner (Autonomous Demo)
:: ============================================================================

set "WORKING_DIR=C:\AI-SEO\mission-control\Antigravity Browser Agent Autonomous Activity Demo"
set "PYTHON_SCRIPT=process_video.py"

cd /d "%WORKING_DIR%"

echo.
echo ============================================================================
echo   STARTING AUTONOMOUS VIDEO PROCESSING
echo ============================================================================
echo   Directory: %WORKING_DIR%
echo   Script   : %PYTHON_SCRIPT%
echo.

:: Check if Python is installed
python --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Python not found in PATH. Please install Python.
    pause
    exit /b 1
)

:: Run the processor
python "%PYTHON_SCRIPT%"

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Processing failed. Check output above.
    pause
    exit /b %errorlevel%
)

echo.
echo ============================================================================
echo   PROCESSING COMPLETE!
echo ============================================================================
echo.
pause
