/**
 * Reproduction for #87 — task deletion.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('#87 — task deletion', () => {
    test('can delete a task via API', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        // Create a task
        const title = 'DelMe ' + Date.now();
        const task = await h.apiCreateTask(title);

        // Delete via API
        const result = await page.evaluate(async (id) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
            return { status: r.status, ok: r.ok };
        }, task.id);

        console.log('Delete result:', JSON.stringify(result));
        expect(result.ok).toBe(true);
        expect(result.status).toBe(204);
    });

    test('deleted task is gone after reload', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        const title = 'Gone ' + Date.now();
        const task = await h.apiCreateTask(title);

        // Delete via API
        await page.evaluate(async (id) => {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/tasks/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` },
            });
        }, task.id);

        // Reload and verify gone
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Task should not appear
        const found = await page.locator(`text="${title}"`).count();
        expect(found).toBe(0);
    });
});
