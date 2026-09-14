/**
 * Shared environment for the e2e suite.
 *
 * The suite runs against a real `php artisan serve` process, so the same values are
 * needed in two places: the migrations in `global-setup.js` and the web server in
 * `playwright.config.js`. They live here so the two cannot drift — and so that a
 * checkout without a `.env` (CI) behaves exactly like a developer machine.
 */

import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Port the app is served on. */
export const PORT = 8888;

/** Throwaway SQLite database, recreated by the global setup on every run. */
export const DB_PATH = path.join(__dirname, 'e2e.sqlite');

/**
 * Fixed key for the throwaway database.
 *
 * `.env` is not tracked, so CI has no key at all — and the server refuses to boot
 * without one, because `title`, `notes` and `subcategory` are AES-256 encrypted.
 * The database is rebuilt from scratch on every run, so a literal key is safe here.
 * Mirrors what `phpunit.xml` already does for the backend suite.
 */
export const APP_KEY = 'base64:mP2aKshFfX69M4Z2vY1oZz9jX7wX8yL6zD5cE4vB3mA=';

/**
 * Environment for the e2e server and for the migrations it serves.
 *
 * Both rate limits are raised far above their production ceilings because the suite
 * drives the app harder than a person can, and both failures are misleading:
 *
 * - `EXCHANGE_CODE_RATE_LIMIT` — every test logs in through `devLogin()`, so at the
 *   production 5/min the sixth test of a run gets a 429 and dies on a login timeout.
 * - `API_RATE_LIMIT` — every test shares one dev user, so all of their API traffic
 *   falls into a single per-user bucket. At 60/min the limit is hit mid-run and the
 *   SPA clears its token, which surfaces as `/api/...` returning the HTML shell and
 *   tests failing on `SyntaxError: Unexpected token '<'`.
 *
 * @returns {Record<string, string>}
 */
export function e2eEnv() {
    return {
        APP_ENV: 'testing',
        APP_KEY,
        APP_URL: `http://localhost:${PORT}`,
        DB_CONNECTION: 'sqlite',
        DB_DATABASE: DB_PATH,
        EXCHANGE_CODE_RATE_LIMIT: '1000',
        API_RATE_LIMIT: '1000',
    };
}
