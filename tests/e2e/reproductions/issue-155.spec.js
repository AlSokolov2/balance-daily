/**
 * Reproduction for #155 — "[IDEA]: Сортировка".
 *
 * "Не хватает сортировки по имени и по датам создания, выполнения и т.п. в архиве и в
 * скрытом архиве. Сейчас не понимаю, в каком порядке они идут."
 *
 * There is no sort UI and no sort state anywhere in the app. The order does exist —
 * `filteredTasks` sorts the archive by `completed_at` desc and the hidden list by
 * `hidden_until` asc — but nothing on screen says so, and the user cannot change it.
 * That is the whole of the complaint: an order nobody can see or choose.
 *
 * This spec asserts the control exists and that picking a different field actually
 * reorders the list.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 1280, height: 800 } });

/**
 * Create a task and complete it at a given instant.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string} title
 * @param {number} completedHoursAgo
 */
async function apiCreateArchived(page, title, completedHoursAgo) {
    return page.evaluate(async ({ t, hoursAgo }) => {
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
            body: JSON.stringify({
                completed: true,
                completed_at: new Date(Date.now() - hoursAgo * 3_600_000).toISOString(),
            }),
        });
        return created;
    }, { t: title, hoursAgo: completedHoursAgo });
}

/**
 * The titles of this spec's own tasks, in the order the list renders them.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string[]>}
 */
async function renderedOrder(page) {
    const titles = await page.locator('.task-item .task-title').allTextContents();
    return titles.map(t => (t.match(/P155-(zulu|alpha|mike)/) || [])[1]).filter(Boolean);
}

test.describe('Reproduction: #155 — sorting the archive', () => {
    test('the archive can be sorted by name instead of completion date', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const stamp = Date.now();
        // Completion order is deliberately the reverse of alphabetical order, so the two
        // sorts cannot produce the same list by accident.
        await apiCreateArchived(page, `P155-zulu-${stamp}`, 1);
        await apiCreateArchived(page, `P155-alpha-${stamp}`, 3);
        await apiCreateArchived(page, `P155-mike-${stamp}`, 2);

        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.locator('.filter-scroll > div').filter({ hasText: /Archive \(/ }).click();

        // Before the fix there is no sort control at all — this is the bug.
        const byName = page.getByRole('button', { name: 'By name' });
        await expect(byName).toBeVisible();

        // The existing order is completion date, newest first. It is what the reporter
        // could not identify, so pin it before changing anything.
        await expect
            .poll(() => renderedOrder(page), { timeout: 5_000 })
            .toEqual(['zulu', 'mike', 'alpha']);

        await byName.click();

        await expect
            .poll(() => renderedOrder(page), { timeout: 5_000 })
            .toEqual(['alpha', 'mike', 'zulu']);
    });

    test('the control is not offered outside the archive and the hidden list', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        await expect(page.getByRole('button', { name: 'By name' })).toBeHidden();
    });
});
