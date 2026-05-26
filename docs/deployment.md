# Руководство по развертыванию (Production)

Проект настроен для автоматического развертывания на Shared Hosting (или VPS) через протокол SSH.

## 1. Подготовка сервера

### Файловая структура
Создайте каталог для приложения (например, `/domains/alekzander.info/public_html/daily`).

### База данных
Создайте базу данных MySQL и пользователя с полными правами к ней.

### Файл .env
Создайте файл `.env` в корне папки приложения на сервере. Обязательные параметры:
```env
APP_NAME="Баланс.Дейли"
APP_ENV=production
APP_KEY=base64:... (сгенерируйте локально через artisan key:generate)
APP_URL=https://alekzander.info/daily

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=имя_бд
DB_USERNAME=логин_бд
DB_PASSWORD=пароль_бд

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL="https://alekzander.info/auth/google/callback"
```

## 2. Настройка GitHub Actions

Перейдите в настройки вашего репозитория **Settings > Secrets and variables > Actions** и добавьте следующие секреты:

*   `SSH_HOST`: IP или домен сервера.
*   `SSH_USER`: SSH логин.
*   `SSH_PORT`: Порт (обычно 22).
*   `SSH_PRIVATE_KEY`: Содержимое вашего приватного ключа.
*   `REMOTE_PATH`: Полный путь к папке приложения на сервере.
*   `APP_URL`: Полный URL (используется для сборки фронтенда, например `https://alekzander.info/daily`).

## 3. Процесс деплоя

Развертывание происходит автоматически при каждом `push` в ветку `master` или `main`.

**GitHub выполнит:**
1.  Запуск всех тестов (CI).
2.  Сборку ассетов Vue 3.
3.  Синхронизацию файлов через `rsync` (исключая `.env` и другие локальные файлы).
4.  Выполнение миграций БД на сервере.
5.  Очистку и прогрев кэша Laravel.

## 4. Специфика подпапок (Apache)

Если вы устанавливаете проект в подпапку (например, `/daily`), в корне этой папки будет автоматически создан файл `.htaccess`, который перенаправляет все запросы в `public/index.php`. 

Убедитесь, что на сервере включен модуль `mod_rewrite`.
