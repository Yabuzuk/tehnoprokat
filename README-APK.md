# Создание APK для Водовозка

## Проблема
Android Studio и Gradle требуют дополнительной настройки на вашем ПК.

## Решения:

### 1. Онлайн сборка APK
Используйте **Capacitor Live Reload**:
```bash
npm run build
npx cap copy
npx cap run android --livereload --external
```

### 2. Альтернативные онлайн сервисы:
- **Monaca** (monaca.io) - загрузите dist папку
- **Voltbuilder** (voltbuilder.com) - Cordova онлайн
- **AppGyver** - бесплатная сборка

### 3. Установка Android Studio:
1. Скачайте Android Studio: https://developer.android.com/studio
2. Установите Android SDK
3. Настройте переменные окружения:
   - ANDROID_HOME = путь к SDK
   - Добавьте в PATH: %ANDROID_HOME%\tools, %ANDROID_HOME%\platform-tools

### 4. Готовые файлы для сборки:
- **Capacitor проект**: папка `android/`
- **Cordova проект**: папка `vodovozka-cordova/`
- **Веб-файлы**: папка `dist/`

## Рекомендация:
Используйте **PWABuilder APK** - он уже работает, просто с адресной строкой.
Для полностью нативного APK нужна настройка Android SDK.