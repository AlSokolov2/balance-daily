# Project Context: Баланс.Дейли (Balance.Daily)

## Project Overview
**Balance.Daily** is a modern task and life-balance manager built on the Laravel + Vue 3 stack. It features a unique mathematical engine for task prioritization and interactive "bubble chart" visualization.

- **Backend:** PHP 8.4+, Laravel 13, Sanctum (API Auth), Socialite (Google OAuth).
- **Frontend:** Vue 3 (Composition API), Pinia (State Management), Vite 6, Tailwind CSS 4.
- **PWA:** Full Progressive Web App support with offline capability and service workers.
- **Architecture:** Laravel acts as a headless API, with Vue 3 serving as the Single Page Application (SPA).
- **Visualization:** Bubble chart packing logic is offloaded to a **Web Worker** (`public/workers/packer.worker.js`) to ensure smooth UI performance.
- **Security:** Sensitive user data (task titles, notes, etc.) is encrypted in the database using AES-256.

## Building and Running

### Development
The project uses a unified command to start all necessary services for local development:
- **Unified Dev:** `composer dev` (starts PHP server, Vite, queue listener, and logs via `concurrently`).
- **Backend only:** `php artisan serve`
- **Frontend only:** `npm run dev`

### Building for Production
- **Build Assets:** `npm run build`

### Testing
- **Backend Tests:** `composer test` or `php artisan test` (uses PHPUnit).
- **Frontend Tests:** `npm test` (uses Vitest).

### Initial Setup
- **Setup Command:** `composer setup` (installs dependencies, generates keys, runs migrations, and builds assets).

## Development Conventions

### Coding Standards
- **PHP:** Adheres to Laravel coding standards. Uses **Pint** for code style.
- **WordPress Standards:** Note that while this is a Laravel project, some parts of the team's global instructions mention WordPress standards. However, for this project, **Laravel idioms take precedence**.
- **Conventional Commits:** All git commits must follow the [Conventional Commits](https://www.conventionalcommits.org/) specification.
- **Documentation:** Use JSDoc for JavaScript and PHPDoc for PHP. Maintain the documentation in the `docs/` directory.

### Project Structure
- `app/Http/Controllers/Api/`: Core API controllers.
- `app/Models/`: Eloquent models with encryption traits where applicable.
- `resources/js/`: Vue 3 source code.
    - `components/`: UI components (including `BubbleChart.vue`).
    - `stores/`: Pinia stores (key file: `balance.js` which handles priority calculations).
- `docs/`: Specialized documentation for algorithm, API, and deployment.
- `database/migrations/`: Database schema definitions.

### Key Logic: Priority Engine
The priority algorithm (`docs/prioritization-algorithm.md`) is implemented in the Pinia store (`resources/js/stores/balance.js`). It factors in category weights, importance, deadlines, and a "dynamic boost" for neglected categories.

### Encryption (SSE)
Sensitive fields like task `title`, `notes`, and `subcategory` are encrypted on the server. Always use the provided Laravel traits/logic when adding new sensitive fields.
