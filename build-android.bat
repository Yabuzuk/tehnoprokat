@echo off
echo Building Android APK with Capacitor...

echo Step 1: Building web assets...
call npm run build

echo Step 2: Copying to Android...
call npx cap copy android

echo Step 3: Syncing...
call npx cap sync android

echo Step 4: Opening Android Studio...
call npx cap open android

echo Done! 
echo In Android Studio:
echo 1. Wait for Gradle sync to complete
echo 2. Go to Build -> Build Bundle(s) / APK(s) -> Build APK(s)
echo 3. APK will be in android/app/build/outputs/apk/debug/
pause