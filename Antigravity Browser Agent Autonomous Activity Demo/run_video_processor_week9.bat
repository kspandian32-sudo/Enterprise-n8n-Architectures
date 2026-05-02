@echo off
setlocal enabledelayedexpansion

title Week 9 Video Processor

echo ============================================================
echo   Video Processor ^| Week 9 Submission
echo   Instagram Auto Publishing Workflow, 30-Day Calendar
echo ============================================================
echo.

:: ---------------------------------------------------------------
:: Check Python availability
:: ---------------------------------------------------------------
where python >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo [ERROR] Python is not found in PATH.
    echo         Please install Python 3.8+ or add it to your system PATH.
    echo.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------
:: Resolve script path (works from any working directory)
:: ---------------------------------------------------------------
set "SCRIPT=%~dp0video_processor_week9.py"
if not exist "%SCRIPT%" (
    echo [ERROR] Script not found:
    echo         %SCRIPT%
    echo         Make sure run_video_processor_week9.bat is in the
    echo         same folder as video_processor_week9.py
    echo.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------
:: Check input video exists before launching Python
:: ---------------------------------------------------------------
set "INPUT_FILE=C:\Users\ks_pa\Downloads\WEEK 9 SUBMISSION\Instagram Auto Publishing Workflow, 30-Day Calendar_First.mp4"
if not exist "%INPUT_FILE%" (
    echo [ERROR] Input video not found:
    echo         %INPUT_FILE%
    echo         Please verify the file is in the WEEK 9 SUBMISSION folder.
    echo.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------
:: Check FFmpeg exists
:: ---------------------------------------------------------------
set "FFMPEG=C:\ffmpeg\ffmpeg-8.1-essentials_build\ffmpeg-8.1-essentials_build\bin\ffmpeg.exe"
if not exist "%FFMPEG%" (
    echo [ERROR] FFmpeg not found at:
    echo         %FFMPEG%
    echo         Please verify your FFmpeg installation path.
    echo.
    pause
    exit /b 1
)

:: ---------------------------------------------------------------
:: Run the processor
:: ---------------------------------------------------------------
echo  [INFO]  Input  : %INPUT_FILE%
echo  [INFO]  Script : %SCRIPT%
echo  [INFO]  FFmpeg : %FFMPEG%
echo.
echo  Starting processing... (this may take several minutes)
echo ============================================================
echo.

python "%SCRIPT%"
set "EXIT_CODE=%ERRORLEVEL%"

echo.
echo ============================================================
if %EXIT_CODE% equ 0 (
    echo   [SUCCESS] All tasks completed successfully!
    echo.
    echo   Output files saved to:
    echo   C:\Users\ks_pa\Downloads\WEEK 9 SUBMISSION\
    echo     - Instagram_AutoPublish_Edited.mp4   (silence removed + speed adjusted)
    echo     - Instagram_AutoPublish_Instagram.mp4 (Instagram 9:16 ready)
) else (
    echo   [ERROR] Processing failed with exit code: %EXIT_CODE%
    echo   Check the log output above for details.
)
echo ============================================================
echo.
pause
exit /b %EXIT_CODE%
