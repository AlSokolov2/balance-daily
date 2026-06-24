# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Architecture

Balance.Daily is a personal task/life-balance manager: **Laravel 13 headless API** + **Vue 3 SPA** + **PWA**.

- **Backend** (`app/`): PHP 8.4+, Laravel 13. Sanctum for token auth, Socialite for Google OAuth. AES-256 encrypts sensitive DB fields (`title`, `notes`, `subcategory`) via Eloquent `encrypted` cast — use the same pattern for any new sensitive field.
- **Frontend** (`resources/js/`): Vue 3 Composition API, Pinia state management, Vue Router (hash mode), Tailwind CSS 4, Vite 8, vue-i18n (ru/en).
- **Entry point**: `resources/views/app.blade.php` serves the SPA shell. `window.apiBaseUrl` is set there from Laravel config. PWA version migration logic runs inline in the `<head>` before the app mounts.
- **Routes** (`routes/`): `web.php` — Google OAuth callbacks + SPA fallback. `api.php` — all REST API endpoints behind `auth:sanctum`.
- **Service Worker** (`resources/js/sw.js`): Workbox-based precaching, Web Push API notifications, SKIP_WAITING handling.
- **Web Worker**: Bubble chart circle-packing runs off-main-thread in `public/workers/packer.worker.js` for 60fps.

## State Management — The Pinia Store

`resources/js/stores/balance.js` is the single central store. It manages **everything**: auth token lifecycle, delta sync, task/category CRUD, theme, locale, push notification subscriptions, the 1-minute priority "pulse" timer, and all getter-derived view models (`bubbleTasks`, `focusTasks`, `plansTasks`, `routineTasks`, `filteredTasks`).

Key behaviors:
- **Init flow**: Check URL for OAuth `token` param → set Bearer header → `GET /user` → `sync()` (full) → `startPulse()`.
- **Delta sync**: If `lastSync` exists, `GET /sync?since=<ISO>` returns only records with `updated_at > since` plus `SyncDelete` entries. Otherwise a full snapshot.
- **Merge logic** (`mergeCollection`): On delta, updates matching items by ID, appends new ones, removes items listed in `deleted`.
- **Pulse**: A `setInterval` (default 1 min) runs `recalculateAll()` to update priority based on deadlines and "new day" resets.
- **Priority engine** (`resources/js/utils/priority-engine.js`): `calcPriority(task, catsMap, subcatCoeffs)` — category weight × importance × subcatCoeff, with deadline bonuses and postpone penalty (×0.7). `recalculateTasks` re-derives category current weights (1.5× boost for categories with 0 completions today, then normalize to 1.0) and missed counts for recurring tasks.

## Commands

```bash
# Unified dev (PHP server + Vite + queue + logs)
composer dev

# Individual services
php artisan serve                    # Backend only
npm run dev                          # Vite HMR only

# Build for production
npm run build

# Frontend tests (Vitest, 100% coverage required on stores/ and utils/)
npm test

# Run a single frontend test file
npx vitest run tests/Javascript/Store/balance.test.js

# Backend tests (PHPUnit, SQLite in-memory)
composer test
php artisan test --filter=SyncTest   # single test class

# Linting & static analysis
npm run lint                         # ESLint (resources/js/)
npm run lint:fix                     # ESLint auto-fix
docker-compose exec app ./vendor/bin/pint    # PHP CS Fixer
docker-compose exec app ./vendor/bin/phpstan analyze app --level=8  # PHP static analysis
```

## Testing

- **Frontend**: Vitest + jsdom, setup at `tests/Javascript/setup.js`. Global mocks for `vue-router`, `vue-i18n`, `virtual:pwa-register/vue`, `matchMedia`, and `__VAPID_PUBLIC_KEY__`/`__APP_VERSION__`. Tests live under `tests/Javascript/` mirroring `resources/js/` structure (Store/, Components/, Unit/). Store tests import and exercise the Pinia store directly — no component mounting needed for getter/action tests.
- **Backend**: PHPUnit with SQLite `:memory:`, env config in `phpunit.xml`. Tests under `tests/Feature/Api/` cover each API controller. Factories in `database/factories/` use `HasFactory` on models.

## Key Patterns

- **Observer for sync deletes**: `SyncObserver` watches `Task` and `Category` `deleted` events, inserting into `sync_deletes` so clients can garbage-collect removed items on next sync.
- **Subdirectory deployment**: `AppServiceProvider` checks `app.url` and forces `SCRIPT_NAME` for subfolder hosting.
- **Dev auth bypass**: In `local`/`testing` env, `GET /auth/dev-login` creates a dev token without OAuth. Used by frontend dev workflow.
- **Recurring task completion**: The store's `updateTask` intercepts completions of recurring tasks — it calculates the next occurrence date, sends `_was_completed: true` to trigger a server-side completion record, but keeps the task active (`completed: false`) with a `hidden_until` date.

## Conventions (from GEMINI.md)

- **Commits**: Conventional Commits in English.
- **Issues/tickets**: Written in Russian.
- **Versioning**: Release without `v` prefix (use `2.5.0`, not `v2.5.0`) — the tooling adds it automatically.
- **Code style**: ESLint with 4-space indent, single quotes, no console warnings, Vue multi-word component names allowed for views. PHP: Laravel Pint.
- **Documentation**: JSDoc for JS, PHPDoc for PHP. Detailed docs in `docs/` directory.

## Docker

Local dev uses 3 containers: `app` (PHP-FPM), `nginx` (port 8000), `db` (MySQL 8.0 on port 3308). Start with `docker-compose up -d`. PHP commands that need the app container should be run through `docker-compose exec app`.
