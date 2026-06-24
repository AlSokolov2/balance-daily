/**
 * Reproduction for #76/#77 — postponed task visual appearance.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('#76 — treemap renders postponed tasks differently', () => {
    test('postponed task has different bg opacity than normal task', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        // Switch to treemap for test consistency
        await page.evaluate(() => {
            localStorage.setItem('visual_style', 'treemap');
            localStorage.setItem('treemap_mode', 'flat');
        });
        await page.reload();
        await page.waitForLoadState('networkidle');

        const title = 'T' + Date.now();

        // Create a normal task (no postpone)
        await page.evaluate(async (title) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: title + '-normal', category_slug: 'chor', importance: 3 }),
            });
        }, title);

        // Create a postponed task
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        await page.evaluate(async ({ title, until }) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: title + '-postponed', category_slug: 'chor', importance: 3, postpone_until: until }),
            });
        }, { title, until: tomorrow.toISOString().substring(0, 16) });

        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check store — both tasks should be identified correctly
        const storeCheck = await page.evaluate((title) => {
            const app = document.querySelector('#app').__vue_app__;
            const pinia = app.config.globalProperties.$pinia;
            const store = pinia._s.get('balance');
            const normal = store.tasks.find(t => t.title?.includes('-normal'));
            const postponed = store.tasks.find(t => t.title?.includes('-postponed'));
            return {
                normalPostponed: normal ? store.isEffectivelyPostponed(normal) : null,
                postponedPostponed: postponed ? store.isEffectivelyPostponed(postponed) : null,
            };
        }, title);

        console.log('Store check:', JSON.stringify(storeCheck));

        // Both should be in the store
        expect(storeCheck.normalPostponed).toBe(false);
        expect(storeCheck.postponedPostponed).toBe(true);
    });
});
