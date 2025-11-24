@echo off
echo Creating APK without Android Studio...

echo Step 1: Building web assets...
call npm run build

echo Step 2: Copying to Android...
call npx cap copy android

echo Step 3: Syncing...
call npx cap sync android

echo Step 4: Building APK...
cd android
call gradlew.bat clean
call gradlew.bat assembleDebug

echo APK created at: android\app\build\outputs\apk\debug\app-debug.apk
pause