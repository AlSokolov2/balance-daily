import { describe, it, expect, vi } from 'vitest';
import { calcPriority, isCategoryPostponed, isEffectivelyPostponed, recalculateTasks } from '../../../resources/js/utils/priority-engine';

describe('Priority Engine - Edge Cases for 100% Coverage', () => {
    
    it('calcPriority returns 0 if category not found', () => {
        const task = { category_slug: 'non-existent' };
        expect(calcPriority(task, {})).toBe(0);
    });

    it('calcPriority uses default weight 0.1 and importance 1', () => {
        const task = { category_slug: 'work' };
        const catsMap = { work: { currentWeight: 0 } }; // Should fallback to 0.1
        expect(calcPriority(task, catsMap)).toBeCloseTo(0.1);
    });

    it('calcPriority applies subcategory coefficients', () => {
        const task = { category_slug: 'work', subcategory: 'dev' };
        const catsMap = { work: { currentWeight: 0.5 } };
        const subcatCoeffs = { dev: 2.0 };
        // 0.5 * 1.0 (imp) * 2.0 (sub) = 1.0
        expect(calcPriority(task, catsMap, subcatCoeffs)).toBe(1.0);

        // Case where subcategory doesn't exist in coeffs
        expect(calcPriority(task, catsMap, { other: 1.5 })).toBe(0.5);
    });

    it('calcPriority handles all deadline branches', () => {
        const catsMap = { work: { currentWeight: 1.0 } };
        const now = new Date('2026-06-07T12:00:00');
        vi.useFakeTimers();
        vi.setSystemTime(now);

        // Overdue (diff < 0): +5
        expect(calcPriority({ category_slug: 'work', deadline: '2026-06-06T12:00:00' }, catsMap)).toBe(6.0);
        
        // Due today (diff === 0 if d <= n but not overdue, but Math.ceil(pos) is >= 1)
        // Actually if d = 12:00 and n = 12:00, diff = 0.
        expect(calcPriority({ category_slug: 'work', deadline: '2026-06-07T12:00:00' }, catsMap)).toBe(5.0);

        // Due tomorrow (diff = 1): 1 <= 2 is TRUE. +3 bonus
        expect(calcPriority({ category_slug: 'work', deadline: '2026-06-08T12:00:00' }, catsMap)).toBe(4.0);

        // Due in 7 days (diff <= 7): +1
        expect(calcPriority({ category_slug: 'work', deadline: '2026-06-14T12:00:00' }, catsMap)).toBe(2.0);

        // Due far away: +0
        expect(calcPriority({ category_slug: 'work', deadline: '2026-06-20T12:00:00' }, catsMap)).toBe(1.0);

        vi.useRealTimers();
    });

    it('isCategoryPostponed handles edge cases for coverage', () => {
        expect(isCategoryPostponed({ hide_until: 'invalid' })).toBe(false);
        expect(isCategoryPostponed({ hide_until: '12:XX' })).toBe(false);
        expect(isCategoryPostponed({ hide_until: 'XX:12' })).toBe(false);
        expect(isCategoryPostponed({ hide_until: ':' })).toBe(false);
        expect(isCategoryPostponed(null)).toBe(false);
    });

    it('isEffectivelyPostponed handles force_active override', () => {
        const catsMap = { work: { hide_until: '23:59' } };
        const task = { category_slug: 'work', force_active: true };
        const now = new Date();
        now.setHours(10, 0);
        expect(isEffectivelyPostponed(task, catsMap, now)).toBe(false);
    });

    it('recalculateTasks handles empty categories', () => {
        const tasks = [{ id: 1 }];
        expect(recalculateTasks(tasks, [])).toEqual(tasks);
    });

    it('recalculateTasks handles interval repeat with default interval', () => {
        const now = new Date('2026-06-07T12:00:00');
        const tasks = [{
            category_slug: 'work',
            repeat_type: 'interval',
            repeat_interval: null, // should default to 1
            last_completed_date: '2026-06-05T12:00:00',
            completed: false
        }];
        const categories = [{ slug: 'work', weight: 1.0 }];
        const result = recalculateTasks(tasks, categories, {}, now);
        // last: 5th, due: 6th, now: 7th. diff = 1 day missed.
        expect(result[0].missed_count).toBe(1);
    });

    it('recalculateTasks handles weekly repeat logic', () => {
        const now = new Date('2026-06-07T12:00:00'); // Sunday (Day 0)
        const tasks = [{
            category_slug: 'work',
            repeat_type: 'weekly',
            repeat_days: [1], // Monday (Day 1)
            last_completed_date: '2026-06-01T12:00:00', // Last Monday
            completed: false
        }];
        const categories = [{ slug: 'work', weight: 1.0 }];
        let result = recalculateTasks(tasks, categories, {}, now);
        expect(result[0].missed_count).toBe(0);

        // Case where we missed a week
        const oldNow = new Date('2026-06-15T12:00:00'); // Monday two weeks later
        result = recalculateTasks(tasks, categories, {}, oldNow);
        expect(result[0].missed_count).toBeGreaterThan(0);
    });

    it('recalculateTasks handles dynamic weights and 0 total weight', () => {
        const categories = [{ slug: 'work', weight: 0 }];
        const tasks = [{ category_slug: 'work', completed: false }];
        const result = recalculateTasks(tasks, categories);
        expect(result[0].calculatedPriority).toBeGreaterThan(0);
    });
});
