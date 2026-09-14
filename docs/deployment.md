# Production Deployment Guide

The project is configured for automated deployment to Shared Hosting (or VPS) via SSH.

## 1. Server Preparation

### Directory Structure
Create a directory for the application (e.g., `/domains/alekzander.info/public_html`). The application must be installed in the root directory of your domain or subdomain.

### Database
Create a MySQL database and a user with full privileges.

### .env File
Create a `.env` file in the application's root folder on the server. Required parameters:
```env
APP_NAME="Balance.Daily"
APP_ENV=production
APP_KEY=base64:... (generate locally via artisan key:generate)
APP_URL=https://daily.alekzander.info

DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_DATABASE=db_name
DB_USERNAME=db_user
DB_PASSWORD=db_password

GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URL="https://daily.alekzander.info/auth/google/callback"
```

## 2. GitHub Actions Setup

Go to your repository settings **Settings > Secrets and variables > Actions** and add the following secrets:

*   `SSH_HOST`: IP or domain of the server.
*   `SSH_USER`: SSH username.
*   `SSH_PORT`: Port (usually 22).
*   `SSH_PRIVATE_KEY`: Content of your private SSH key.
*   `REMOTE_PATH`: Full path to the application folder on the server.
*   `PHP_BINARY`: (Optional) The path to the PHP 8.4 executable on your server (e.g., `/usr/bin/php8.4`). Required if the default `php` command points to an older version.

## 3. Deployment Process

Deployment happens on every `push` of a `v*` tag (the release tag points at the merge
commit of a `develop` → `master` pull request). Pushes to `develop` and pull requests
into `develop`/`master` run the tests only.

The pipeline (`.github/workflows/deploy.yml`) has two gates, run in parallel:

*   **`ci-testing`** — ESLint, PHPStan level 8, PHPUnit, Vitest, on a frontend build.
*   **`e2e`** — Playwright against a real `php artisan serve`. The suite is self-contained:
    `tests/e2e/global-setup.js` builds the frontend again and migrates its own throwaway
    `tests/e2e/e2e.sqlite`, so the job needs no `.env` and no secrets. Shared values live
    in `tests/e2e/env.js`. The html report is uploaded as the `playwright-report` artifact
    on every run, pass or fail.

The e2e suite drives the app far harder than a person can, so it raises the rate limits
from `config/rate_limits.php` through the environment instead of removing the middleware.

**GitHub will perform:**
1.  Wait for both `ci-testing` and `e2e`.
2.  Build Vue 3 assets with absolute paths.
3.  Synchronize files via `rsync` (excluding `.env` and other local files).
4.  Run database migrations on the server.
5.  Clear and warm up Laravel cache.

## 4. Apache Server Configuration

The project includes a `.htaccess` file in the root directory that automatically redirects all requests to `public/index.php`. This ensures compatibility with most shared hosting environments where you cannot change the `DocumentRoot`.

Ensure that the `mod_rewrite` module is enabled on the server.
