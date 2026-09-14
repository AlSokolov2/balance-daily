/**
 * Reproduction for #166 — a category created from Settings could not be edited afterwards.
 *
 * `SettingsView.addCategory()` routes to `/category/cat_new_<Date.now()>`, and that slug is
 * exactly what `POST /categories` persists: `CategoryController::store()` writes it verbatim
 * through `updateOrCreate`, there is no server-side slug generation. The `cat_new_` prefix
 * therefore outlives the session that created it.
 *
 * `EditCategoryView` used to derive `isNew` from that prefix alone, so a saved category stayed
 * "new" forever: the screen showed the "New" placeholder and the grey `#8e8e93` default instead
 * of the real name and colour, and `EditCategoryModal` hid its delete button behind
 * `v-if="!isNew"`.
 *
 * There was a second, unreported symptom on the same path: pressing Save on that screen ran
 * `handleSave`, which found the row by slug and `PUT` the placeholder values — silently
 * overwriting the real name and colour.
 *
 * The fix makes the prefix necessary but not sufficient: a category counts as new only when it
 * carries the prefix AND is absent from the store.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

/**
 * Read the category slug out of the hash route.
 *
 * @param {import('@playwright/test').Page} page
 * @returns {Promise<string>}
 */
function currentSlug(page) {
    return page.evaluate(() => window.location.hash.replace(/^#\/category\//, ''));
}

/**
 * Wait until the category screen has finished replacing the settings screen.
 *
 * `App.vue` wraps `<router-view>` in a `<transition>`, so the outgoing screen stays mounted for
 * the length of the leave animation and both screens' buttons are present for a moment. Waiting
 * for the duplicate to disappear keeps the locators below unambiguous without reaching for DOM
 * structure or `nth()`.
 *
 * @param {import('@playwright/test').Page} page
 */
async function waitForCategoryScreen(page) {
    await expect(page.getByRole('heading', { name: 'Category Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Save' })).toHaveCount(1);
}

test.describe('Reproduction: #166 — a saved category keeps its real values and delete button', () => {
    test('a category created from Settings is still editable after saving', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        await page.goto('/#/settings');
        await page.getByRole('button', { name: 'Categories', exact: true }).click();
        await page.getByRole('button', { name: '+ Add' }).click();

        // The click routes to `/category/cat_new_<Date.now()>`; wait for that navigation, then
        // keep the slug — it is what `POST /categories` will persist verbatim.
        await expect(page).toHaveURL(/#\/category\/cat_new_\d+$/);
        const slug = await currentSlug(page);
        await waitForCategoryScreen(page);

        // The create screen is legitimately new, so it shows the placeholder name.
        const name = `166 Sport ${Date.now()}`;
        const color = '#123456';

        const nameInput = page.locator('input[type="text"]');
        await expect(nameInput).toHaveValue('New');

        await nameInput.fill(name);
        await page.locator('input[type="color"]').evaluate((el, value) => {
            el.value = value;
            el.dispatchEvent(new Event('input', { bubbles: true }));
        }, color);

        await page.getByRole('button', { name: 'Save' }).click();
        await expect(page).toHaveURL(/#\/settings/);

        // Reopen the very same category from the list. The slug in the URL still carries the
        // prefix — that is the whole point of the bug.
        await page.getByRole('button', { name: 'Categories', exact: true }).click();
        await page.getByText(name, { exact: true }).click();
        await expect(page).toHaveURL(new RegExp(`#/category/${slug}$`));
        await waitForCategoryScreen(page);

        // Before the fix these three assertions all failed: the screen fell back to the
        // "New" / `#8e8e93` placeholders and the delete button was not rendered at all.
        await expect(page.locator('input[type="text"]')).toHaveValue(name);
        await expect(page.locator('input[type="color"]')).toHaveValue(color);
        await expect(page.getByRole('button', { name: 'Delete' })).toBeVisible();
    });
});
