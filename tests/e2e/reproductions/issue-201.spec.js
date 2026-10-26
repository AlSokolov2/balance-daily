/**
 * Reproduction for #201 — "Переносить строку".
 *
 * "Хотелось бы, чтобы можно было в названии переносить слова на строку ниже. Т.е. если,
 * скажем, больше двух слов в названии, визуально удобнее, когда перенос сделан вручную,
 * а не автоматом посередине слова."
 *
 * The title used to be a single-line `<input>`: Enter did nothing, and even a newline that
 * reached the API was collapsed by normal white-space when rendered.
 *
 * This spec asserts the break can be typed in the editor, reaches the API, and is kept by
 * the chart after the round-trip.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Reproduction: #201 — manual line breaks in the title', () => {
    test('a line break typed in the editor survives saving and renders on the chart', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const first = `P201-${Date.now()}`;
        const task = await h.apiCreateTask(first, 'chor', 2);

        // The initial sync ran before the task existed — reload so the edit view can resolve
        // it from store.tasks.
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.goto(`/#/task/${task.id}`);

        const title = page.locator('textarea.task-title-input');
        await expect(title).toBeVisible();
        await expect(title).toHaveValue(first);

        // Enter must insert a line break; the old single-line input swallowed it.
        await title.click();
        await title.press('End');
        await title.press('Enter');
        await title.pressSequentially('second line');

        const putPromise = page.waitForRequest(
            (req) => /\/api\/tasks\/\d+$/.test(req.url()) && req.method() === 'PUT',
            { timeout: 10_000 }
        );
        await page.getByRole('button', { name: 'Save' }).click();
        const body = JSON.parse((await putPromise).postData());

        expect(body.title).toBe(`${first}\nsecond line`);

        // Back on the main screen, the bubble must keep the break instead of collapsing it.
        const bubble = page.locator('.bubble').filter({ hasText: first });
        await expect(bubble).toBeVisible();
        const whiteSpace = await bubble.locator('span').first()
            .evaluate(el => getComputedStyle(el).whiteSpace);
        expect(whiteSpace).toBe('pre-line');

        // And the break survives re-opening the editor.
        await page.goto(`/#/task/${task.id}`);
        await expect(page.locator('textarea.task-title-input')).toHaveValue(`${first}\nsecond line`);
    });
});
