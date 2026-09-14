/**
 * Reproduction for #156 — "Просроченные - счетчик дней".
 *
 * "Хорошо бы, чтобы у просроченных задач прямо на схеме в названии задачи, только ниже
 * был счетчик дней. Допустим, задача обозначается так: стирка / (2)."
 *
 * The number already exists in the engine for one case only: `recalculateTasks` counts
 * `missed_count` for repeats. For a plain task with a deadline in the past the day
 * difference is computed inside `calcPriority` and then thrown away — nothing on the
 * chart says how long the task has been overdue.
 *
 * This spec asserts the counter is rendered under the title on the bubble.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Reproduction: #156 — overdue day counter', () => {
    test('an overdue task shows how many days it is overdue, under its name', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const title = `P156-${Date.now()}`;
        // Noon, two calendar days back. Noon keeps the day difference unambiguous, and the
        // engine truncates to calendar days on purpose — the same maths `missed_count` uses.
        const deadline = new Date();
        deadline.setDate(deadline.getDate() - 2);
        deadline.setHours(12, 0, 0, 0);

        await page.evaluate(async ({ t, dl }) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: t, category_slug: 'chor', importance: 3, deadline: dl }),
            });
        }, { t: title, dl: deadline.toISOString() });

        await page.reload();
        await page.waitForLoadState('networkidle');

        const bubble = page.locator('.bubble').filter({ hasText: title });
        await expect(bubble).toBeVisible();

        // Before the fix the bubble holds the title and nothing else — this is the bug.
        await expect(bubble.getByText('(2)')).toBeVisible();
    });

    test('a task that is not overdue shows no counter', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const title = `P156-future-${Date.now()}`;
        const deadline = new Date(Date.now() + 3 * 86_400_000);

        await page.evaluate(async ({ t, dl }) => {
            const token = localStorage.getItem('auth_token');
            await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ title: t, category_slug: 'chor', importance: 3, deadline: dl }),
            });
        }, { t: title, dl: deadline.toISOString() });

        await page.reload();
        await page.waitForLoadState('networkidle');

        const bubble = page.locator('.bubble').filter({ hasText: title });
        await expect(bubble).toBeVisible();
        await expect(bubble.getByText(/\(\d+\)/)).toBeHidden();
    });
});
