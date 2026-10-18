import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { DB_PATH, e2eEnv } from './env.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

/**
 * Global setup: build frontend + migrate test database (once per suite).
 */
async function globalSetup() {
    // Ensure test directory exists
    mkdirSync(__dirname, { recursive: true });

    // Fresh database
    rmSync(DB_PATH, { force: true });

    // Build frontend (production, as served to users)
    console.log('  Building frontend...');
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

    // Run migrations against the same environment the web server will use.
    // execSync replaces the child environment outright, so process.env has to be
    // merged back in — without PATH the `php` on this line is not on it.
    console.log('  Running migrations...');
    execSync('php artisan migrate --force', {
        stdio: 'inherit',
        cwd: rootDir,
        env: { ...process.env, ...e2eEnv() },
    });

    console.log('  ✅ E2E setup complete\n');
}

export default globalSetup;
