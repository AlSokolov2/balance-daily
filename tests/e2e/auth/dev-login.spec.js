import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('Dev Login', () => {
    test('logs in via dev-login and loads the app', async ({ page }) => {
        const h = helpers(page);

        await h.devLogin();
        await h.waitForApp();

        await expect(page.locator('body')).not.toContainText('Sign in with Google');
        const token = await page.evaluate(() => localStorage.getItem('auth_token'));
        expect(token).toBeTruthy();
    });

    test('can logout and clear auth state', async ({ page }) => {
        const h = helpers(page);

        await h.devLogin();
        await h.waitForApp();

        // Open user menu — click the user info area in the header
        // The header has a div with @click="emit('toggle-menu')" around user name/avatar
        const header = page.locator('header');
        // Click the rightmost clickable element in the header (user menu trigger)
        const menuTrigger = header.locator('[class*="cursor-pointer"]').last();
        if (await menuTrigger.count() > 0) {
            await menuTrigger.click();
            await page.waitForTimeout(300);
        }

        // Click Logout button inside the opened menu
        const logoutBtn = page.getByRole('button', { name: /Logout|Выйти/i });
        await logoutBtn.click({ timeout: 5_000 });

        // Wait for logout to complete
        await page.waitForTimeout(500);

        const token = await page.evaluate(() => localStorage.getItem('auth_token'));
        expect(token).toBeNull();
    });

    test('survives page reload with persisted token', async ({ page }) => {
        const h = helpers(page);

        await h.devLogin();
        await h.waitForApp();

        const tokenBefore = await page.evaluate(() => localStorage.getItem('auth_token'));
        expect(tokenBefore).toBeTruthy();

        await page.reload();
        await h.waitForApp();

        const tokenAfter = await page.evaluate(() => localStorage.getItem('auth_token'));
        expect(tokenAfter).toBeTruthy();
    });
});
