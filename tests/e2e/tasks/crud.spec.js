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

    test('shows "Saved" toast after quick-add', async ({ page }) => {
        const h = helpers(page);
        const title = 'Toast Task ' + Date.now();

        await h.quickAddTask(title);

        // Toast should appear with "Saved" text
        const toast = page.locator('.fixed.bottom-24:has-text("Saved")');
        await expect(toast).toBeVisible({ timeout: 3_000 });

        // Toast should auto-hide within 3 seconds
        await expect(toast).not.toBeVisible({ timeout: 3_000 });
    });

    test('shows "Saved" toast after editing a task', async ({ page }) => {
        const h = helpers(page);
        const originalTitle = 'Toast Edit ' + Date.now();

        // Create a task first via API
        const task = await h.apiCreateTask(originalTitle);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Navigate directly to the edit task page
        await page.goto(`/#/task/${task.id}`);
        await page.waitForSelector('input[type="text"]', { timeout: 5_000 });

        // Click Save
        const saveBtn = page.locator('button:has-text("Save")');
        await saveBtn.click();

        // Toast should appear with "Saved" text
        const toast = page.locator('.fixed.bottom-24:has-text("Saved")');
        await expect(toast).toBeVisible({ timeout: 3_000 });
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
