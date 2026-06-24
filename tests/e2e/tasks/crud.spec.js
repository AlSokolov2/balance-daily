import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('Task CRUD', () => {
    test.beforeEach(async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
    });

    test('creates a task and sees it on page', async ({ page }) => {
        const h = helpers(page);
        const title = 'Quick Task ' + Date.now();

        await h.quickAddTask(title);
        await expect(page.locator(`text="${title}"`).first()).toBeVisible({ timeout: 5_000 });
    });

    test('API task survives reload, then delete removes it', async ({ page }) => {
        const h = helpers(page);
        const title = 'API Task ' + Date.now();

        // Create via API
        const task = await h.apiCreateTask(title);

        // Verify after reload
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text="${title}"`).first()).toBeVisible({ timeout: 5_000 });

        // Delete via API
        await page.evaluate(async (id) => {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/tasks/${id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } });
        }, task.id);

        // Verify gone after reload
        await page.reload();
        await page.waitForLoadState('networkidle');
        await expect(page.locator(`text="${title}"`)).toHaveCount(0);
    });
});
