/**
 * Reproduction for #161 — "Отложенное не убралось" (+ #158, same mechanism).
 *
 * The "is postponed" predicate used to be re-derived independently in every layer,
 * each with its own `new Date()`, and the charts disagreed with the list:
 *
 *   engine / list / mobile groups:  postpone_until > now  ||  (category hidden && !force_active)
 *   bubbles / treemap:              same, but with a blanket `&& !force_active` on top
 *
 * i.e. the charts let "Relevant" cancel a postpone date the user had set explicitly,
 * while the engine and the list did not.
 *
 * So a task with an explicit "postpone until" AND the "Relevant" (force_active) box ticked
 * stayed central and fully opaque in the chart while the very same task was dimmed and
 * badged "postponed" in the list — exactly what the reporter saw, and her own comment on
 * the issue ("там стояла галочка «Актуально»") names the trigger.
 *
 * The second half of #158 is staleness: `new Date()` is not a reactive dependency, so a
 * cached computed never invalidated and the postponed state never expired live — only a
 * reload or a sync cleared it. The engine now materialises the state onto the task itself,
 * which is what the pulse mutates.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

/**
 * Create a task with arbitrary fields via the API.
 *
 * @param {import('@playwright/test').Page} page
 * @param {Object} fields
 * @returns {Promise<Object>} The created task.
 */
async function apiCreateTask(page, fields) {
    return page.evaluate(async (f) => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify(f),
        });
        return r.json();
    }, fields);
}

/**
 * Open the desktop task list panel (hidden by default).
 *
 * @param {import('@playwright/test').Page} page
 */
async function showTaskList(page) {
    await page.getByRole('button', { name: 'Task list' }).click();
    await page.waitForTimeout(300);
}

test.describe('Reproduction: #161 — postponed state is consistent across layers', () => {
    test('an explicit "postpone until" wins over "Relevant" in the bubble chart', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const title = `P161-actual-${Date.now()}`;
        const tomorrow = new Date(Date.now() + 86_400_000).toISOString();

        await apiCreateTask(page, {
            title,
            category_slug: 'chor',
            importance: 3,
            postpone_until: tomorrow,
            force_active: true,
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await showTaskList(page);

        // The list already agreed: dimmed and badged.
        const item = page.locator('.task-item').filter({ hasText: title });
        await expect(item).toBeVisible();
        await expect(item).toHaveClass(/opacity-50/);
        await expect(item.getByText('postponed')).toBeVisible();

        // The bubble did not — this is the bug. `bgAlpha` is 0.05 for a postponed task and
        // 0.25 for an active one, and it is written straight into the bubble's inline style.
        // Before the fix the chart's own `!force_active` gate made this 0.25.
        const bubble = page.locator('.bubble').filter({ hasText: title });
        await expect(bubble).toHaveAttribute('style', /rgba\(\d+, \d+, \d+, 0\.05\)/);
    });

    test('the postponed state expires live, without a reload', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const title = `P161-expire-${Date.now()}`;
        const soon = new Date(Date.now() + 10_000).toISOString();

        await apiCreateTask(page, {
            title,
            category_slug: 'chor',
            importance: 3,
            postpone_until: soon,
        });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await showTaskList(page);

        const item = page.locator('.task-item').filter({ hasText: title });
        await expect(item).toBeVisible();
        await expect(item).toHaveClass(/opacity-50/);
        await expect(item.getByText('postponed')).toBeVisible();

        // Wait for the instant the user set to actually pass in the browser's clock, rather
        // than sleeping a fixed amount — the assertion stays valid on a slow runner too.
        await page.waitForFunction(
            (iso) => Date.now() > new Date(iso).getTime(),
            soon,
            { timeout: 30_000 }
        );

        // Run the same call the one-minute pulse runs (tasks.js `startPulse` -> `recalculateAll`).
        // Nothing else touches the page here: no reload, no sync.
        await page.evaluate(() => {
            const pinia = document.querySelector('#app').__vue_app__.config.globalProperties.$pinia;
            pinia._s.get('tasks').recalculateAll();
        });

        // Before the fix the computed had cached the predicate and never invalidated, because
        // `new Date()` is not a reactive dependency — the task stayed dimmed until a sync.
        await expect(item).not.toHaveClass(/opacity-50/);
        await expect(item.getByText('postponed')).toBeHidden();
    });
});
