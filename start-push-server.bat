@echo off
echo 🚀 Запуск Push-сервера для уведомлений...
echo.

REM Проверяем наличие Node.js
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js не найден! Установите Node.js с https://nodejs.org/
    pause
    exit /b 1
)

REM Проверяем наличие зависимостей
if not exist node_modules\express (
    echo 📦 Устанавливаем зависимости...
    npm install express firebase-admin cors
)

echo 📡 Запускаем сервер на http://localhost:3001
echo 💡 Для остановки нажмите Ctrl+C
echo.

node push-server-simple.js

pause