import { defineConfig, devices } from '@playwright/test';
import { PORT, e2eEnv } from './tests/e2e/env.js';

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
        // Playwright merges this over process.env, so PATH and friends survive.
        command: `php artisan serve --port=${PORT}`,
        env: e2eEnv(),
        port: PORT,
        timeout: 60_000,
        reuseExistingServer: !process.env.CI,
    },

    timeout: 30_000,
    expect: { timeout: 10_000 },
});
