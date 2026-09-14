/**
 * Reproduction for #151 — "МОБ: архив и скрытый архив" ("Как их найти в моб.версии?").
 *
 * The only filter UI in the app is `DesktopFilterBar`, and it is rendered in exactly one
 * place — `MainView.vue`, inside `v-if="!isHandheld"`. The handheld branch has no filter
 * control at all: no chips, no dropdown, and `MobileBottomNav` only knows
 * Home / Stats / Add / Notepad / Settings.
 *
 * So on a phone `filterCat` is permanently `'all'`, and `'all'` drops completed and
 * currently-hidden tasks from both the list (`balance.js`) and the bubble slides — meaning
 * finished tasks are not reachable *anywhere* in the mobile layout, not merely "hard to
 * find". That is the part the ticket does not spell out.
 *
 * This spec asserts the reachability itself: the chip is on screen and tapping it puts the
 * archived task in the list.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

/**
 * Create a task and complete it, so it lands in the archive.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 * @returns {Promise<Object>} The created task.
 */
async function apiCreateArchived(page, title) {
    return page.evaluate(async (t) => {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const created = await (await fetch('/api/tasks', {
            method: 'POST',
            headers,
            body: JSON.stringify({ title: t, category_slug: 'chor', importance: 3 }),
        })).json();
        await fetch(`/api/tasks/${created.id}`, {
            method: 'PUT',
            headers,
            body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }),
        });
        return created;
    }, title);
}

/**
 * Create a task hidden until tomorrow, so it lands in the hidden list.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 * @returns {Promise<Object>} The created task.
 */
async function apiCreateHidden(page, title) {
    return page.evaluate(async (t) => {
        const token = localStorage.getItem('auth_token');
        const r = await fetch('/api/tasks', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
            body: JSON.stringify({
                title: t,
                category_slug: 'chor',
                importance: 3,
                hidden_until: new Date(Date.now() + 86_400_000).toISOString(),
            }),
        });
        return r.json();
    }, title);
}

test.describe('Reproduction: #151 — reaching the archive on a phone', () => {
    test('the archive and hidden lists are reachable from the mobile layout', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const archived = `P151-arch-${Date.now()}`;
        const hidden = `P151-hid-${Date.now()}`;
        await apiCreateArchived(page, archived);
        await apiCreateHidden(page, hidden);

        // The initial sync ran before the tasks existed.
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Guard the premise: this is the handheld branch, which is the one missing the filter.
        await expect(page.locator('.mobile-scroll-container')).toBeVisible();

        // Before the fix there is no `.filter-scroll` in this branch at all — this is the bug.
        const chips = page.locator('.filter-scroll > div');
        const archiveChip = chips.filter({ hasText: /Archive \(/ });
        await expect(archiveChip).toBeVisible();

        await archiveChip.click();
        await expect(page.locator('.task-item').filter({ hasText: archived })).toBeVisible();

        const hiddenChip = chips.filter({ hasText: /Hidden \(/ });
        await expect(hiddenChip).toBeVisible();

        await hiddenChip.click();
        await expect(page.locator('.task-item').filter({ hasText: hidden })).toBeVisible();
    });
});
