@echo off
title AMURKA GitHub Sync
echo ============================================
echo   AMURKA — SSM to GitHub Sync
echo ============================================
echo.

where node >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js не установлен!
    echo Скачай: https://nodejs.org
    pause
    exit /b 1
)

echo Запуск синхронизации...
echo Нажми Ctrl+C чтобы остановить.
echo.

node sync-github.js %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Ошибка. Проверь config.json
)
pause
