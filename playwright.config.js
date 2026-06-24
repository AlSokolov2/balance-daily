import { defineConfig, devices } from '@playwright/test';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 8888;
const DB_PATH = path.join(__dirname, 'tests/e2e/e2e.sqlite');

export default defineConfig({
    testDir: './tests/e2e',
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: 1,
    reporter: [
        ['html', { open: 'never' }],
        ['list'],
    ],
    use: {
        baseURL: `http://localhost:${PORT}`,
        trace: 'on-first-retry',
        screenshot: 'only-on-failure',
    },

    projects: [
        { name: 'chromium', use: { ...devices['Desktop Chrome'], serviceWorkers: 'block' } },
    ],

    globalSetup: './tests/e2e/global-setup.js',

    webServer: {
        command: `APP_ENV=testing APP_URL="http://localhost:${PORT}" DB_CONNECTION=sqlite DB_DATABASE="${DB_PATH}" php artisan serve --port=${PORT}`,
        port: PORT,
        timeout: 15_000,
        reuseExistingServer: true,
    },

    timeout: 30_000,
    expect: { timeout: 10_000 },
});
