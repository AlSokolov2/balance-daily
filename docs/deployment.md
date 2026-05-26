# Production Deployment Guide

The project is configured for automated deployment to Shared Hosting (or VPS) via SSH.

## 1. Server Preparation

### Directory Structure
Create a directory for the application (e.g., `/domains/alekzander.info/public_html/daily`).

### Database
Create a MySQL database and a user with full privileges.

### .env File
Create a `.env` file in the application's root folder on the server. Required parameters:
```env
APP_NAME="Balance.Daily"
APP_ENV=production
APP_KEY=base64:... (generate locally via artisan key:generate)
APP_URL=https://alekzander.info/daily

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=db_name
DB_USERNAME=db_user
DB_PASSWORD=db_password

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL="https://alekzander.info/auth/google/callback"
```

## 2. GitHub Actions Setup

Go to your repository settings **Settings > Secrets and variables > Actions** and add the following secrets:

*   `SSH_HOST`: IP or domain of the server.
*   `SSH_USER`: SSH username.
*   `SSH_PORT`: Port (usually 22).
*   `SSH_PRIVATE_KEY`: Content of your private SSH key.
*   `REMOTE_PATH`: Full path to the application folder on the server.
*   `APP_URL`: Full URL (used for frontend building, e.g., `https://alekzander.info/daily`).
*   `PHP_BINARY`: (Optional) The path to the PHP 8.4 executable on your server (e.g., `/usr/bin/php8.4`). Required if the default `php` command points to an older version.

## 3. Deployment Process

Deployment happens automatically on every `push` to the `master` or `main` branch.

**GitHub will perform:**
1.  Run all tests (CI).
2.  Build Vue 3 assets.
3.  Synchronize files via `rsync` (excluding `.env` and other local files).
4.  Run database migrations on the server.
5.  Clear and warm up Laravel cache.

## 4. Subdirectory Specifics (Apache)

If you install the project in a subdirectory (e.g., `/daily`), a `.htaccess` file will be automatically created in the root of that folder to redirect all requests to `public/index.php`.

Ensure that the `mod_rewrite` module is enabled on the server.
