@echo off
REM Fix Port 11434 Conflict
REM This script finds and kills the process using port 11434

echo.
echo ===================================================
echo      Port 11434 Conflict Resolver
echo ===================================================
echo.

echo [1] Checking what's using port 11434...
echo.

netstat -ano | findstr :11434 > temp_port.txt

if %ERRORLEVEL% EQU 0 (
    echo Found process using port 11434:
    echo.
    type temp_port.txt
    echo.
    
    REM Extract PID from netstat output
    for /f "tokens=5" %%a in ('netstat -ano ^| findstr :11434 ^| findstr LISTENING') do (
        set PID=%%a
        goto :found
    )
    
    :found
    if defined PID (
        echo [2] Process ID: %PID%
        echo.
        
        REM Get process name
        echo [3] Process details:
        tasklist /FI "PID eq %PID%" /FO TABLE
        echo.
        
        REM Ask for confirmation
        set /p CONFIRM="Kill this process? (Y/N): "
        
        if /i "%CONFIRM%"=="Y" (
            echo.
            echo [4] Killing process %PID%...
            taskkill /F /PID %PID%
            
            if %ERRORLEVEL% EQU 0 (
                echo.
                echo ✓ Process killed successfully!
                echo.
                echo [5] You can now start tui-listener:
                echo     node tui-listener.js
            ) else (
                echo.
                echo ✗ Failed to kill process. You may need to run as Administrator.
            )
        ) else (
            echo.
            echo Cancelled. Process not killed.
        )
    ) else (
        echo ✗ Could not extract PID from netstat output
    )
) else (
    echo ✓ Port 11434 is available! No process using it.
    echo.
    echo You can start tui-listener now:
    echo     node tui-listener.js
)

echo.
del temp_port.txt 2>nul
echo ===================================================
pause
