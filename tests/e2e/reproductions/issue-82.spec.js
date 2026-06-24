/**
 * Reproduction for #82 — hidden task list disappears after edit modal round-trip.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('#82 — hidden list survives page transitions', () => {
    test('hidden tasks visible after navigating away and back', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        // Create a hidden task via API
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.evaluate(async (hiddenUntil) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: 'Hidden 82',
                    category_slug: 'chor',
                    importance: 3,
                    hidden_until: hiddenUntil,
                }),
            });
        }, tomorrow.toISOString());

        // Reload with hidden category active by setting filter via route param? No.
        // Just reload, then set filterCat via Pinia
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Set filter to hidden via the Pinia store
        await page.evaluate(() => {
            // Access store — it's on the Vue app
            const app = document.querySelector('#app').__vue_app__;
            const pinia = app.config.globalProperties.$pinia;
            const store = pinia._s.get('balance');
            store.filterCat = 'hidden';
        });
        await page.waitForTimeout(500);

        // Verify hidden task is visible
        await expect(page.locator('text=Hidden 82').first()).toBeVisible({ timeout: 5_000 });

        // Navigate away and back (simulates opening edit modal and closing)
        await page.goto('/');
        await page.waitForLoadState('networkidle');

        // Set filter to hidden again
        await page.evaluate(() => {
            const app = document.querySelector('#app').__vue_app__;
            const pinia = app.config.globalProperties.$pinia;
            const store = pinia._s.get('balance');
            store.filterCat = 'hidden';
        });
        await page.waitForTimeout(500);

        // Hidden task should still be visible
        await expect(page.locator('text=Hidden 82').first()).toBeVisible({ timeout: 5_000 });
    });
});
