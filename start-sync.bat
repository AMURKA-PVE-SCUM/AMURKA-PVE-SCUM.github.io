@echo off
title AMURKA Sync — SSM Bridge
echo ============================================
echo   AMURKA Sync — SSM API to JSON Bridge
echo ============================================
echo.
echo Reading config from data/config.json...
echo.

node sync-ssm.js %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] sync-ssm.js failed. Make sure Node.js is installed.
    echo.
)
pause
