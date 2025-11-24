# 🤖 Автоматическая сборка APK

## Вариант 1: GitHub Actions (рекомендуется)

### Создайте файл `.github/workflows/build-apk.yml`:

```yaml
name: Build Android APK

on:
  push:
    branches: [ main, master ]
  pull_request:
    branches: [ main, master ]
  workflow_dispatch:

jobs:
  build:
    runs-on: ubuntu-latest
    
    steps:
    - name: Checkout code
      uses: actions/checkout@v3
    
    - name: Setup Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'
        cache: 'npm'
    
    - name: Setup Java
      uses: actions/setup-java@v3
      with:
        distribution: 'temurin'
        java-version: '17'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build web app
      run: npm run build
      env:
        VITE_SUPABASE_URL: ${{ secrets.VITE_SUPABASE_URL }}
        VITE_SUPABASE_ANON_KEY: ${{ secrets.VITE_SUPABASE_ANON_KEY }}
    
    - name: Sync Capacitor
      run: |
        npx cap copy android
        npx cap sync android
    
    - name: Build APK
      run: |
        cd android
        chmod +x gradlew
        ./gradlew assembleDebug
    
    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
    
    - name: Create Release
      if: github.ref == 'refs/heads/main'
      uses: softprops/action-gh-release@v1
      with:
        tag_name: v${{ github.run_number }}
        files: android/app/build/outputs/apk/debug/app-debug.apk
      env:
        GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Настройка:

1. **Добавьте секреты в GitHub:**
   - Settings → Secrets → Actions → New repository secret
   - `VITE_SUPABASE_URL`: ваш Supabase URL
   - `VITE_SUPABASE_ANON_KEY`: ваш Supabase Anon Key

2. **Закоммитьте и запушьте:**
```bash
git add .github/workflows/build-apk.yml
git commit -m "Add auto APK build"
git push
```

3. **APK соберётся автоматически** при каждом push в main

4. **Скачать APK:**
   - Actions → Build Android APK → Latest run → Artifacts → app-debug

---

## Вариант 2: GitLab CI/CD

### Создайте `.gitlab-ci.yml`:

```yaml
image: node:18

stages:
  - build
  - android

variables:
  ANDROID_SDK_TOOLS: "9477386"

build_web:
  stage: build
  script:
    - npm ci
    - npm run build
  artifacts:
    paths:
      - dist/
    expire_in: 1 hour

build_apk:
  stage: android
  image: mingc/android-build-box:latest
  dependencies:
    - build_web
  script:
    - npx cap copy android
    - npx cap sync android
    - cd android
    - chmod +x gradlew
    - ./gradlew assembleDebug
  artifacts:
    paths:
      - android/app/build/outputs/apk/debug/app-debug.apk
    expire_in: 1 week
```

---

## Вариант 3: Локальный скрипт (Windows)

### Создайте `auto-build.bat`:

```batch
@echo off
echo ========================================
echo Автоматическая сборка APK
echo ========================================

echo.
echo [1/5] Установка зависимостей...
call npm install

echo.
echo [2/5] Сборка веб-приложения...
call npm run build

echo.
echo [3/5] Копирование в Android...
call npx cap copy android

echo.
echo [4/5] Синхронизация Capacitor...
call npx cap sync android

echo.
echo [5/5] Сборка APK...
cd android
call gradlew assembleDebug
cd ..

echo.
echo ========================================
echo ✅ APK готов!
echo ========================================
echo Путь: android\app\build\outputs\apk\debug\app-debug.apk
echo.

pause
```

Запуск: `auto-build.bat`

---

## Вариант 4: Docker

### Создайте `Dockerfile.android`:

```dockerfile
FROM node:18 AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM mingc/android-build-box:latest

WORKDIR /app
COPY --from=builder /app .

RUN npx cap copy android && \
    npx cap sync android && \
    cd android && \
    chmod +x gradlew && \
    ./gradlew assembleDebug

CMD ["cp", "android/app/build/outputs/apk/debug/app-debug.apk", "/output/"]
```

### Сборка:

```bash
docker build -f Dockerfile.android -t apk-builder .
docker run -v ${PWD}/output:/output apk-builder
```

---

## Вариант 5: Vercel + GitHub Actions

Деплой веба на Vercel, APK через GitHub Actions:

### `vercel.json`:
```json
{
  "buildCommand": "npm run build",
  "outputDirectory": "dist",
  "framework": "vite"
}
```

### GitHub Actions (как в Варианте 1)

---

## 🎯 Рекомендация

**GitHub Actions** - самый простой и надёжный вариант:
- ✅ Бесплатно (2000 минут/месяц)
- ✅ Автоматически при каждом push
- ✅ Хранение APK в Artifacts
- ✅ Автоматические релизы

**Локальный скрипт** - для быстрой разработки:
- ✅ Не требует настройки CI/CD
- ✅ Работает офлайн
- ❌ Нужно запускать вручную

---

## 📦 Подписание APK (для продакшена)

### Создайте keystore:

```bash
keytool -genkey -v -keystore my-release-key.keystore -alias my-key-alias -keyalg RSA -keysize 2048 -validity 10000
```

### Обновите `android/app/build.gradle`:

```gradle
android {
    signingConfigs {
        release {
            storeFile file('my-release-key.keystore')
            storePassword System.getenv("KEYSTORE_PASSWORD")
            keyAlias 'my-key-alias'
            keyPassword System.getenv("KEY_PASSWORD")
        }
    }
    buildTypes {
        release {
            signingConfig signingConfigs.release
        }
    }
}
```

### GitHub Actions с подписанием:

```yaml
- name: Build signed APK
  run: |
    cd android
    ./gradlew assembleRelease
  env:
    KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
    KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
```

---

## 🚀 Быстрый старт

1. Скопируйте GitHub Actions workflow в `.github/workflows/build-apk.yml`
2. Добавьте секреты в GitHub
3. Запушьте код
4. APK соберётся автоматически!

Время сборки: ~5-10 минут