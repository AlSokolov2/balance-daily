/**
 * Reproduction for #197 — "менять круг колесиком".
 *
 * "А что если можно было бы менять диаметр круга прямо на рисунке с помощью колесика
 * мышки?"
 *
 * The chart had only a global zoom (buttons + pinch), so there was no way to make one
 * task stand out. This spec resizes a single bubble with the wheel and checks that the
 * factor is persisted and survives a reload.
 *
 * Two tasks with equal priority are created on purpose: the packer auto-scales the whole
 * layout to the viewport, so only the ratio between bubbles proves that the manual factor
 * changes this circle rather than the global scale.
 */

import { test, expect } from '@playwright/test';
import { helpers } from '../helpers.js';

test.use({ viewport: { width: 1280, height: 800 } });

test.describe('Reproduction: #197 — manual bubble resize with the wheel', () => {
    test('the wheel resizes one bubble and the size survives a reload', async ({ page }) => {
        const h = helpers(page);
        await h.ensureLoggedIn();
        await h.waitForApp();

        const stamp = Date.now();
        const targetTitle = `P197-target-${stamp}`;
        const siblingTitle = `P197-sibling-${stamp}`;
        const target = await h.apiCreateTask(targetTitle, 'chor', 3);
        await h.apiCreateTask(siblingTitle, 'chor', 3);

        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(700);

        const bubble = page.locator('.bubble').filter({ hasText: targetTitle });
        const sibling = page.locator('.bubble').filter({ hasText: siblingTitle });
        await expect(bubble).toBeVisible();
        await expect(sibling).toBeVisible();

        const sizeRatio = async () => {
            const targetBox = await bubble.boundingBox();
            const siblingBox = await sibling.boundingBox();
            return targetBox.width / siblingBox.width;
        };

        // Equal priorities -> equal automatic diameters.
        const before = await sizeRatio();
        expect(before).toBeCloseTo(1, 1);

        // Two notches up. Dispatched on the element so a repack between the events
        // cannot move the circle out from under a real mouse pointer.
        await bubble.evaluate((el) => {
            for (let i = 0; i < 2; i++) {
                el.dispatchEvent(new WheelEvent('wheel', {
                    deltaY: -100,
                    bubbles: true,
                    cancelable: true,
                }));
            }
        });

        // Debounced PUT (400 ms) + repack.
        await page.waitForTimeout(900);

        expect(await sizeRatio()).toBeGreaterThan(before * 1.1);

        const savedScale = await page.evaluate(async (id) => {
            const token = localStorage.getItem('auth_token');
            const r = await fetch(`/api/tasks/${id}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            return (await r.json()).size_scale;
        }, target.id);
        expect(savedScale).toBeGreaterThan(1);

        // The manual factor is part of the synced task, not a local-only tweak.
        await page.reload();
        await page.waitForLoadState('networkidle');
        await page.waitForTimeout(700);

        expect(await sizeRatio()).toBeGreaterThan(1.1);
    });
});
