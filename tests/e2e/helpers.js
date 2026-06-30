/**
 * Shared helpers for e2e tests.
 *
 * @param {import('@playwright/test').Page} page
 */
export function helpers(page) {
    return {
        /**
         * Log in via dev-login and switch to English locale.
         */
        async devLogin() {
            // Set locale BEFORE login so app loads in English
            await page.goto('/');
            await page.evaluate(() => { localStorage.setItem('locale', 'en'); });

            // Navigate to dev-login
            await page.goto('/auth/dev-login');

            // Wait for the SPA to redirect away from the auth screen.
            // The auth screen shows login buttons; once logged in, they disappear.
            await page.waitForFunction(() => {
                try {
                    const body = document.body.textContent || '';
                    const hasToken = !!localStorage.getItem('auth_token');
                    const isAuthScreen = body.includes('Sign in with Google') || body.includes('Войти через Google')
                        || body.includes('Login with VK ID') || body.includes('Войти через VK ID');
                    return hasToken && !isAuthScreen;
                } catch { return false; }
            }, { timeout: 15_000 });

            await page.waitForTimeout(500);
        },

        /**
         * Ensure we are logged in. Reuses existing token if available.
         */
        async ensureLoggedIn() {
            await this.devLogin();
        },

        /**
         * Wait for the app shell to finish loading.
         */
        async waitForApp() {
            await page.waitForLoadState('networkidle');
        },

        /**
         * Quick-add a task: type into the main input and press Enter.
         */
        async quickAddTask(title) {
            const input = page.locator('input[placeholder*="done"]');
            await input.fill(title);
            await input.press('Enter');
            await page.waitForTimeout(500);
        },

        /**
         * Create a task via API.
         */
        async apiCreateTask(title, categorySlug = 'chor', importance = 3) {
            return page.evaluate(async (t) => {
                const token = localStorage.getItem('auth_token');
                const r = await fetch('/api/tasks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ title: t.title, category_slug: t.categorySlug, importance: t.importance }),
                });
                return r.json();
            }, { title, categorySlug, importance });
        },
    };
}
