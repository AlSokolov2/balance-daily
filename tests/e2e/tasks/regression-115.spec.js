import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.describe('Regression #115 — task save with date fields', () => {
    test.beforeEach(async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
    });

    test('quick-add form creates a task successfully', async ({ page }) => {
        const h = helpers(page);
        const title = 'QuickAdd ' + Date.now();

        // This path previously sent deadline: '' and postpone_until: ''
        // which caused MySQL "Incorrect datetime value: ''" error (500).
        // After the fix, the form sends null and backend sanitizes '' → null.
        await h.quickAddTask(title);

        // Must appear in the task list
        await expect(page.locator(`text="${title}"`).first()).toBeVisible({ timeout: 5_000 });
    });

    test('quick-add multiple tasks in a row', async ({ page }) => {
        const h = helpers(page);

        for (const label of ['A', 'B', 'C']) {
            const title = `Batch ${label} ${Date.now()}`;
            await h.quickAddTask(title);
            await expect(page.locator(`text="${title}"`).first()).toBeVisible({ timeout: 5_000 });
            await page.waitForTimeout(200);
        }
    });

    test('API: create task with empty string dates is sanitized to null', async ({ page }) => {
        const title = 'EmptyDates ' + Date.now();

        const task = await page.evaluate(async (t) => {
            const token = localStorage.getItem('auth_token');
            // Send empty strings — exactly what the buggy form used to send
            const r = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: t,
                    category_slug: 'chor',
                    importance: 2,
                    deadline: '',
                    postpone_until: '',
                }),
            });
            return r.json();
        }, title);

        // Backend sanitizeDateFields converts '' → null
        // SQLite accepts both, but the response must have null dates
        expect(task.id).toBeDefined();
        expect(task.title).toBe(title);
        expect(task.deadline).toBeNull();
        expect(task.postpone_until).toBeNull();
    });

    test('API: update task with empty string dates is sanitized to null', async ({ page }) => {
        const h = helpers(page);
        const title = 'UpdateEmpty ' + Date.now();

        // Create via API (clean data)
        const task = await h.apiCreateTask(title);

        // Update with empty strings — simulates buggy edit path
        const updated = await page.evaluate(async (t) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch(`/api/tasks/${t.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    deadline: '',
                    postpone_until: '',
                    hidden_until: '',
                    last_completed_date: '',
                    completed_at: '',
                }),
            });
            return r.json();
        }, task);

        // All date fields must be null after sanitization
        expect(updated.deadline).toBeNull();
        expect(updated.postpone_until).toBeNull();
        expect(updated.hidden_until).toBeNull();
        expect(updated.last_completed_date).toBeNull();
        expect(updated.completed_at).toBeNull();
    });

    test('API: task retrieved after create has null dates when empty string sent', async ({ page }) => {
        const h = helpers(page);
        const title = 'PersistCheck ' + Date.now();

        // Create with empty strings
        const created = await page.evaluate(async (t) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch('/api/tasks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
                body: JSON.stringify({
                    title: t,
                    category_slug: 'chor',
                    importance: 2,
                    deadline: '',
                    postpone_until: '',
                }),
            });
            return r.json();
        }, title);

        // Fetch the task by ID to verify persistence
        const fetched = await page.evaluate(async (id) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch(`/api/tasks/${id}`, { headers: { Authorization: `Bearer ${token}` } });
            return r.json();
        }, created.id);

        expect(fetched.id).toBe(created.id);
        expect(fetched.title).toBe(title);
        expect(fetched.deadline).toBeNull();
        expect(fetched.postpone_until).toBeNull();
    });
});
