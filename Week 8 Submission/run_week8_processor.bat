@echo off
echo ============================================================
echo   PURE REMEDY SOLUTIONS - Week 8 Video Processor
echo   AI Learning Machine - Autonomous Research Engine
echo ============================================================
echo.

cd /d "C:\Users\ks_pa\Downloads\Week 8 Submission"

echo Activating Python virtual environment...
call "C:\Users\ks_pa\Downloads\Week 8 Submission\venv\Scripts\activate.bat" 2>nul
if errorlevel 1 (
    echo [INFO] No venv found - using system Python
)

echo.
echo Running week8_video_processor.py ...
echo.

python week8_video_processor.py

echo.
echo ============================================================
echo   Processing complete. Check output files above.
echo ============================================================
pause
