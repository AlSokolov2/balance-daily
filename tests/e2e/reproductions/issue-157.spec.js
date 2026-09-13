/**
 * Reproduction for #157 — "Кнопка масштаба закрывает нижний угол".
 *
 * "В архиве список задач. С правой стороны экрана от каждой по три кнопки. Невозможно
 * пользоваться этими кнопками у самой последней задачи в списке, т.к. ее перекрывают
 * кнопки масштабирования."
 *
 * The zoom pill is anchored `absolute bottom-4 right-4`, and its positioned ancestor is
 * MainView itself — `App.vue` renders the view with `class="absolute inset-0"`. In the
 * archive the bubble chart is not rendered at all and the list fills the whole column, so
 * the pill comes to rest on the last row's actions: restore, edit, delete.
 *
 * Why the assertion is a hit test and not a click. Playwright auto-scrolls a target into
 * view before dispatching, and here that scroll is worth exactly enough to save it: the list
 * rests at scrollTop 348, Playwright nudges it to 316, and the button centre lands one pixel
 * below the pill's lower edge. Measured, not guessed — a click assertion passes against the
 * bug. A finger or a mouse has no such autoscroll, so what the reporter meets is the hit test
 * at the position the list actually comes to rest at, and that is what this asserts.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 1280, height: 800 } });

/**
 * Create tasks and complete them, so the archive has rows to list.
 *
 * @param {import('@playwright/test').Page} page
 * @param {string[]} titles
 */
async function apiCreateArchived(page, titles) {
    await page.evaluate(async (names) => {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        for (const name of names) {
            const created = await (await fetch('/api/tasks', {
                method: 'POST',
                headers,
                body: JSON.stringify({ title: name, category_slug: 'chor', importance: 3 }),
            })).json();
            await fetch(`/api/tasks/${created.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }),
            });
        }
    }, titles);
}

/**
 * The list scrolled to its end, which is where the last row ends up under the pill.
 *
 * @param {import('@playwright/test').Page} page
 */
async function scrollListToEnd(page) {
    await page.evaluate(() => {
        const rows = [...document.querySelectorAll('.task-item')];
        const last = rows[rows.length - 1];
        let el = last.parentElement;
        while (el && el.scrollHeight <= el.clientHeight + 1) el = el.parentElement;
        if (el) el.scrollTop = el.scrollHeight;
    });
    await page.waitForTimeout(300);
}

/**
 * For each action button of the last row: `null` when the button is its own hit target, and
 * otherwise the class of whatever sits on top of it.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<(string|null)[]>}
 */
async function blockedButtons(page) {
    return page.evaluate(() => {
        const rows = [...document.querySelectorAll('.task-item')];
        const last = rows[rows.length - 1];
        return [...last.querySelectorAll('.task-actions button')].map(b => {
            const r = b.getBoundingClientRect();
            const hit = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
            if (b === hit || b.contains(hit)) return null;
            return hit ? hit.className : 'off-screen';
        });
    });
}

test.describe('Reproduction: #157 — the zoom control covers the last task in the archive', () => {
    test('the last archived task is not covered by the zoom control', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const stamp = Date.now();
        // Enough rows that the list overflows: the last one only reaches the pill once the
        // list is scrolled to its end.
        await apiCreateArchived(page, Array.from(
            { length: 14 },
            (_, i) => `P157-${stamp}-${String(i + 1).padStart(2, '0')}`
        ));

        await page.reload();
        await page.waitForLoadState('networkidle');

        await page.locator('.filter-scroll > div').filter({ hasText: /Archive \(/ }).click();

        // The sort control renders in the archive and the hidden list only (#155), so its
        // presence is what confirms the chip actually switched the view.
        await expect(page.getByRole('button', { name: 'By completion' })).toBeVisible();

        const lastRow = page.locator('.task-item').last();
        await expect(lastRow).toBeVisible();
        // A completed task in the archive offers restore, edit and delete — the three
        // buttons the report is about.
        await expect(lastRow.locator('.task-actions button')).toHaveCount(3);

        await scrollListToEnd(page);

        await expect
            .poll(() => blockedButtons(page), { timeout: 5_000 })
            .toEqual([null, null, null]);
    });

    test('the zoom control is still offered while the chart is on screen', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        // The pill belongs to the chart, so clearing it off the list must not clear it off
        // the view it exists for.
        await expect(page.getByRole('button', { name: '1.0x' })).toBeVisible();
    });
});
