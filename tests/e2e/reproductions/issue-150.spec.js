/**
 * Reproduction for #150 — "Моб: Изменить повторяемость".
 *
 * The only numeric input in the edit form is "every N days" (`v-model.number` on
 * `<input type="number">`). Clearing it does not yield null or 0 — `looseToNumber('')`
 * returns the empty string as-is — and the repeat `select` only changes `repeat_type`, so
 * `repeat_interval: ''` stayed in the payload.
 *
 * Empty strings become null in Laravel's global middleware, `nullable|integer` accepts
 * null, and `repeat_interval` is declared `integer NOT NULL` — so the save came back as a
 * 500 and the form could only say "Error saving task". Same class as #115, which fixed the
 * datetime fields only.
 *
 * Reported on a phone, and clearing a field with the touch keyboard is how it was hit, so
 * the spec runs at a mobile viewport.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test.describe('Reproduction: #150 — clearing the repeat interval', () => {
    test('saves a usable repeat interval instead of an empty string', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const title = `P150-${Date.now()}`;
        const task = await page.evaluate(async (t) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: t,
                    category_slug: 'chor',
                    importance: 3,
                    repeat_type: 'interval',
                    repeat_interval: 3,
                }),
            });
            return r.json();
        }, title);

        // The initial sync ran before the task existed — reload so the edit view can resolve
        // it from store.tasks.
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.goto(`/#/task/${task.id}`);

        const scheduleTab = page.getByRole('button', { name: 'Schedule' });
        await scheduleTab.waitFor({ state: 'visible', timeout: 10_000 });
        await scheduleTab.click();
        await page.waitForTimeout(300);

        // Step 1 of the report: clear the number field.
        const intervalInput = page.locator('input[type="number"]');
        await expect(intervalInput).toHaveValue('3');
        await intervalInput.fill('');

        // Step 2: switch the repeat off. The input unmounts, but the value stays in the form
        // model — which is how the empty string reached the API.
        const repeatType = page.locator('select').filter({ has: page.locator('option[value="interval"]') });
        await repeatType.selectOption('none');

        const dialogs = [];
        page.on('dialog', (dialog) => {
            dialogs.push(dialog.message());
            dialog.dismiss();
        });

        const putPromise = page.waitForRequest(
            (req) => /\/api\/tasks\/\d+$/.test(req.url()) && req.method() === 'PUT',
            { timeout: 10_000 }
        );
        await page.getByRole('button', { name: 'Save' }).click();
        const body = JSON.parse((await putPromise).postData());

        expect(body.repeat_type).toBe('none');
        // Falling back to the column default keeps the request valid; `''` does not.
        expect(body.repeat_interval).toBe(1);
        // Dropping the repeat must not leave the weekly day list behind.
        expect(body.repeat_days).toEqual([]);
        // Before the fix the 500 landed in handleSave's catch and raised this alert.
        expect(dialogs).toEqual([]);
    });
});
