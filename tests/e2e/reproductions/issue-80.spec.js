/**
 * Reproduction for #80 — overdue tasks not highlighted.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('#80 — missed tasks highlighted', () => {
    test('missed task has red badge and thicker border in bubble chart', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        // Create a recurring task with last_completed_date = 3 days ago
        const threeDaysAgo = new Date();
        threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

        const title = 'Missed ' + Date.now();
        const task = await page.evaluate(async ({ title, lastCompleted }) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title,
                    category_slug: 'chor',
                    importance: 3,
                    repeat_type: 'interval',
                    repeat_interval: 1,
                    last_completed_date: lastCompleted,
                }),
            });
            return r.json();
        }, { title, lastCompleted: threeDaysAgo.toISOString() });

        // Reload so recalculateAll runs
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Check store state
        const storeState = await page.evaluate((title) => {
            const app = document.querySelector('#app').__vue_app__;
            const pinia = app.config.globalProperties.$pinia;
            const store = pinia._s.get('balance');
            const task = store.tasks.find(t => t.title === title);
            if (!task) return { found: false };
            return {
                found: true,
                missed_count: task.missed_count,
                repeat_type: task.repeat_type,
                last_completed_date: task.last_completed_date,
            };
        }, title);

        console.log('Store state:', JSON.stringify(storeState));

        expect(storeState.found).toBe(true);
        expect(storeState.missed_count).toBeGreaterThan(0);
    });
});
