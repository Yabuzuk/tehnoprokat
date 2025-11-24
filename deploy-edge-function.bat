@echo off
echo Deploying Supabase Edge Function...

REM Установка Supabase CLI (если не установлен)
where supabase >nul 2>nul
if %errorlevel% neq 0 (
    echo Installing Supabase CLI...
    npm install -g supabase
)

REM Логин в Supabase (если нужно)
echo Logging into Supabase...
supabase login

REM Деплой функции
echo Deploying send-push-notification function...
supabase functions deploy send-push-notification --project-ref pmebqzbjtdmbaoqjfbev

echo Edge Function deployed successfully!
pause