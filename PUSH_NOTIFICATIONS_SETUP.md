# Настройка Push-уведомлений для Android

## 1. Настройка Firebase

1. Перейдите в [Firebase Console](https://console.firebase.google.com/)
2. Создайте новый проект или выберите существующий
3. Добавьте Android приложение:
   - Package name: `com.tehnoprokat.app` (из capacitor.config.ts)
   - Скачайте `google-services.json`

## 2. Добавление google-services.json

Поместите файл `google-services.json` в папку:
```
android/app/google-services.json
```

## 3. Настройка Android проекта

Файлы уже настроены автоматически при синхронизации:
- `android/app/build.gradle` - добавлен Google Services plugin
- `android/build.gradle` - добавлена зависимость classpath
- `AndroidManifest.xml` - добавлены разрешения и сервисы

## 4. Тестирование push-уведомлений

После настройки Firebase можно тестировать уведомления:

1. Соберите и установите APK
2. Откройте приложение и разрешите уведомления
3. Отправьте тестовое уведомление из Firebase Console

## 5. Интеграция с приложением

Push-уведомления уже интегрированы в код:
- Регистрация токена при авторизации
- Обработка уведомлений в фоне
- Показ уведомлений о статусе заказов

## Готово!

После добавления `google-services.json` можно собирать APK с поддержкой push-уведомлений.