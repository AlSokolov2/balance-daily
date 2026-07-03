/**
 * Reproduction for #124 — archive list truncation at bottom.
 *
 * Root cause: desktop content div (flex parent of task list card) lacked
 * min-h-0. With overflow:visible (default) and min-height:auto (flex default),
 * the div expanded to fit its content. Added min-h-0 to break the chain.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

const TASK_COUNT = 10;

async function seedArchivedTasks(page, prefix) {
    const tasks = await page.evaluate(async ({ prefix, count }) => {
        const token = localStorage.getItem('auth_token');
        const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };
        const tasks = [];

        for (let i = 1; i <= count; i++) {
            const title = `${prefix}${String(i).padStart(2, '0')}`;

            const createResp = await fetch('/api/tasks', {
                method: 'POST',
                headers,
                body: JSON.stringify({ title, category_slug: 'chor', importance: 3 }),
            });

            if (!createResp.ok) {
                const text = await createResp.text();
                throw new Error(`Create task failed (${createResp.status}): ${text.substring(0, 200)}`);
            }

            const task = await createResp.json();

            // Complete task
            await fetch(`/api/tasks/${task.id}`, {
                method: 'PUT',
                headers,
                body: JSON.stringify({ completed: true, completed_at: new Date().toISOString() }),
            });

            tasks.push(task);

            // Small delay to stay under Laravel rate limiter (60/min per user).
            // 10 tasks × 2 requests × 2 tests = 40 API calls total.
            await new Promise(r => setTimeout(r, 100));
        }
        return tasks;
    }, { prefix, count: TASK_COUNT });
    return tasks;
}

async function switchToArchive(page) {
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.evaluate(() => {
        const app = document.querySelector('#app').__vue_app__;
        const store = app.config.globalProperties.$pinia._s.get('balance');
        store.filterCat = 'archive';
    });
    await page.waitForTimeout(600);
}

test.describe('#124 — archive list scroll truncation', () => {
    test('desktop: scroll container is scrollable and last task is fully visible', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await seedArchivedTasks(page, 'D');
        await switchToArchive(page);

        const lastTask = page.locator('text=D10').first();
        await expect(lastTask).toBeAttached({ timeout: 5_000 });

        const scrollInfo = await page.evaluate(() => {
            const container = document.querySelector('.card .overflow-y-auto.min-h-0');
            if (!container) return { found: false };
            container.scrollTop = container.scrollHeight;
            return {
                found: true,
                canScroll: container.scrollHeight > container.clientHeight,
                clientHeight: container.clientHeight,
                scrollHeight: container.scrollHeight,
                didScroll: container.scrollTop > 0,
            };
        });

        expect(scrollInfo.found).toBe(true);
        expect(scrollInfo.canScroll).toBe(true);
        expect(scrollInfo.didScroll).toBe(true);
        await expect(lastTask).toBeVisible({ timeout: 3_000 });
    });

    test('mobile: scroll container is scrollable and last task is fully visible', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();

        // Wait for SPA to finish initial sync before making API calls.
        // This is important when the DB already has data from a previous test.
        await page.waitForFunction(() => {
            try {
                const app = document.querySelector('#app').__vue_app__;
                const store = app.config.globalProperties.$pinia._s.get('balance');
                return store.lastSync !== null;
            } catch { return false; }
        }, { timeout: 10_000 });
        await page.waitForTimeout(500);

        // Create archived tasks while still on desktop viewport
        await seedArchivedTasks(page, 'M');

        // Switch to mobile viewport and reload
        await page.setViewportSize({ width: 375, height: 667 });
        await page.waitForTimeout(300);
        await page.reload();
        await page.waitForLoadState('networkidle');

        // Set archive filter
        await page.evaluate(() => {
            const app = document.querySelector('#app').__vue_app__;
            const store = app.config.globalProperties.$pinia._s.get('balance');
            store.filterCat = 'archive';
        });
        await page.waitForTimeout(600);

        const lastTask = page.locator('text=M10').first();
        await expect(lastTask).toBeAttached({ timeout: 5_000 });

        const scrollInfo = await page.evaluate(() => {
            const container = document.querySelector('.task-list-container .overflow-y-auto.min-h-0');
            if (!container) return { found: false };
            container.scrollTop = container.scrollHeight;
            return {
                found: true,
                canScroll: container.scrollHeight > container.clientHeight,
                clientHeight: container.clientHeight,
                scrollHeight: container.scrollHeight,
                didScroll: container.scrollTop > 0,
            };
        });

        expect(scrollInfo.found).toBe(true);
        expect(scrollInfo.canScroll).toBe(true);
        expect(scrollInfo.didScroll).toBe(true);
        await expect(lastTask).toBeVisible({ timeout: 3_000 });
    });
});
