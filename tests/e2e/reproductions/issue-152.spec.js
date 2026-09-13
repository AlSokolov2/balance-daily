/**
 * Reproduction for #152 — manual completion mark time shifted by the local UTC offset.
 *
 * Root cause: `<input type="datetime-local">` yields a naive local wall-clock string
 * ("2026-09-12T14:30") with no timezone. That string was POSTed to /api/task-completions
 * as-is; the backend (app.timezone=UTC) parsed it as 14:30 UTC, and the UI then converted
 * that instant back to local time for display — adding the offset (+3h in Moscow).
 *
 * The project contract elsewhere is UTC instants (`tasks.js` uses `new Date().toISOString()`),
 * so the fix converts at the form boundary.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

// Pin the browser timezone so the assertion is deterministic on any machine and in CI
// (a UTC runner would not exhibit the bug at all).
test.use({ timezoneId: 'Europe/Moscow' });

const TYPED = '2026-09-12T14:30';

async function openHistoryTab(page, task) {
    // The store is populated by the initial sync, which already happened before the task
    // was created via the API — reload so EditTaskView can resolve it from store.tasks.
    await page.reload();
    await page.waitForLoadState('networkidle');

    await page.goto(`/#/task/${task.id}`);

    const historyTab = page.getByRole('button', { name: 'History' });
    await historyTab.waitFor({ state: 'visible', timeout: 10_000 });
    await historyTab.click();
    await page.waitForTimeout(300);
}

test.describe(`Reproduction: #152 — completion mark time shift`, () => {
    test('sends an absolute UTC instant instead of a naive local string', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        const task = await h.apiCreateTask('TZ152 payload', 'chor', 3);

        await openHistoryTab(page, task);

        await page.locator('input[type="datetime-local"]').fill(TYPED);

        const requestPromise = page.waitForRequest(
            (req) => req.url().includes('task-completions') && req.method() === 'POST'
        );
        await page.getByRole('button', { name: 'Add' }).click();
        const request = await requestPromise;

        const body = JSON.parse(request.postData());
        const expectedIso = await page.evaluate((typed) => new Date(typed).toISOString(), TYPED);

        // Before the fix this was the naive '2026-09-12T14:30' — the server read it as
        // 14:30 UTC, which the UI then rendered as 17:30 Moscow time.
        expect(body.completed_at).toBe(expectedIso);
    });

    test('shows the entered time back to the user', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        const task = await h.apiCreateTask('TZ152 display', 'chor', 3);

        await openHistoryTab(page, task);

        await page.locator('input[type="datetime-local"]').fill(TYPED);

        const requestPromise = page.waitForRequest(
            (req) => req.url().includes('task-completions') && req.method() === 'POST'
        );
        await page.getByRole('button', { name: 'Add' }).click();
        await requestPromise;

        // Mirror the component's own formatter so the expectation stays locale-agnostic.
        const expectedTime = await page.evaluate((typed) => {
            const locale = localStorage.getItem('locale') === 'ru' ? 'ru-RU' : 'en-US';
            return new Date(typed).toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
        }, TYPED);

        await expect(page.getByText(expectedTime)).toBeVisible({ timeout: 5_000 });
    });

    test('round-trips the deadline field without drifting by the offset', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        const task = await h.apiCreateTask('TZ152 deadline', 'chor', 3);

        // A known wall-clock deadline, stored as the matching UTC instant — exactly what a
        // deadline set from the browser and synced back down looks like.
        const storedIso = await page.evaluate(() => new Date('2026-09-14T09:15').toISOString());
        await page.evaluate(async ({ id, iso }) => {
            const token = localStorage.getItem('auth_token');
            await fetch(`/api/tasks/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({ deadline: iso }),
            });
        }, { id: task.id, iso: storedIso });

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.goto(`/#/task/${task.id}`);

        const scheduleTab = page.getByRole('button', { name: 'Schedule' });
        await scheduleTab.waitFor({ state: 'visible', timeout: 10_000 });
        await scheduleTab.click();
        await page.waitForTimeout(300);

        const deadlineInput = page.locator('input[type="datetime-local"]').first();

        // Loading: the field must show the wall-clock the user set, not the UTC reading of it.
        // Before the fix `.substring(0, 16)` rendered '2026-09-14T06:15' here.
        await expect(deadlineInput).toHaveValue('2026-09-14T09:15');

        // Saving: whatever the field holds must go back out as an absolute UTC instant.
        const retyped = '2026-09-15T08:45';
        await deadlineInput.fill(retyped);

        const requestPromise = page.waitForRequest(
            (req) => /\/api\/tasks\/\d+$/.test(req.url()) && req.method() === 'PUT'
        );
        await page.getByRole('button', { name: 'Save' }).click();
        const request = await requestPromise;

        const body = JSON.parse(request.postData());
        const expectedIso = await page.evaluate((typed) => new Date(typed).toISOString(), retyped);

        expect(body.deadline).toBe(expectedIso);
    });
});
