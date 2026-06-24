import { execSync } from 'child_process';
import { mkdirSync, rmSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');
const dbPath = path.join(__dirname, 'e2e.sqlite');

/**
 * Global setup: build frontend + migrate test database (once per suite).
 */
async function globalSetup() {
    // Ensure test directory exists
    mkdirSync(__dirname, { recursive: true });

    // Fresh database
    rmSync(dbPath, { force: true });

    // Build frontend (production, as served to users)
    console.log('  Building frontend...');
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });

    // Run migrations
    console.log('  Running migrations...');
    execSync(
        `APP_ENV=testing DB_CONNECTION=sqlite DB_DATABASE="${dbPath}" php artisan migrate --force`,
        { stdio: 'inherit', cwd: rootDir }
    );

    console.log('  ✅ E2E setup complete\n');
}

export default globalSetup;
