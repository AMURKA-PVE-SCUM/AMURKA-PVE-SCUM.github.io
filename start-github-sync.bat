@echo off
title AMURKA GitHub Sync
echo ============================================
echo   AMURKA — SSM to GitHub Sync
echo ============================================
echo.
echo Данные с SSM будут отправлены на сайт через GitHub.
echo GitHub Pages обновится автоматически.
echo.
echo Нажми Ctrl+C чтобы остановить.
echo.

node sync-github.js %*

if %errorlevel% neq 0 (
    echo.
    echo [ERROR] Установи Node.js: https://nodejs.org
    echo.
)
pause
