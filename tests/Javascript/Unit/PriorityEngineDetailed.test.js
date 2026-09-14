import { describe, it, expect, vi } from 'vitest';
import { calcPriority, isCategoryPostponed, isEffectivelyPostponed, recalculateTasks, overdueDays } from '../../../resources/js/utils/priority-engine';

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

describe('Priority Engine - materialised postponed flag (#161)', () => {
    it('materialises the flag for every task at one shared `now`', () => {
        const now = new Date('2026-06-07T12:00:00Z');
        const categories = [{ slug: 'work', weight: 1.0 }];
        const tasks = [
            { category_slug: 'work', completed: false, postpone_until: '2026-06-08T12:00:00Z' },
            { category_slug: 'work', completed: false, postpone_until: '2026-06-06T12:00:00Z' },
            { category_slug: 'work', completed: false, postpone_until: null }
        ];

        recalculateTasks(tasks, categories, {}, now);

        expect(tasks.map(t => t.postponed)).toEqual([true, false, false]);
    });

    it('lets an explicit postpone_until win over force_active', () => {
        const now = new Date('2026-06-07T12:00:00Z');
        const categories = [{ slug: 'work', weight: 1.0, hide_until: '23:59' }];
        const tasks = [
            // force_active cancels the category hide, but not a date the user set explicitly
            { category_slug: 'work', completed: false, force_active: true, postpone_until: '2026-06-08T12:00:00Z' },
            { category_slug: 'work', completed: false, force_active: true, postpone_until: null }
        ];

        recalculateTasks(tasks, categories, {}, now);

        expect(tasks[0].postponed).toBe(true);
        expect(tasks[1].postponed).toBe(false);
    });

    it('materialises the flag even before any category has synced', () => {
        const tasks = [{ category_slug: 'work', postpone_until: '2099-01-01T00:00:00Z' }];

        recalculateTasks(tasks, [], {}, new Date('2026-06-07T12:00:00Z'));

        // The view layer reads this flag unconditionally, so the early return for an empty
        // category list must not leave it undefined.
        expect(tasks[0].postponed).toBe(true);
    });

    it('calcPriority applies the postpone penalty at the passed `now`, not the system clock', () => {
        const catsMap = { work: { currentWeight: 1.0 } };
        const task = { category_slug: 'work', postpone_until: '2026-06-08T12:00:00Z' };

        expect(calcPriority(task, catsMap, {}, new Date('2026-06-07T12:00:00Z'))).toBeCloseTo(0.7);
        expect(calcPriority(task, catsMap, {}, new Date('2026-06-09T12:00:00Z'))).toBeCloseTo(1.0);
    });
});

describe('Priority Engine — overdue day counter (#156)', () => {
    // Local-time construction throughout: the counter truncates to calendar days, so a test
    // written in UTC would depend on the machine's offset.
    const now = new Date(2026, 5, 10, 12, 0, 0);

    it('counts whole days since the deadline passed', () => {
        expect(overdueDays({ deadline: new Date(2026, 5, 9, 12, 0, 0) }, now)).toBe(1);
        expect(overdueDays({ deadline: new Date(2026, 5, 9, 23, 59, 0) }, now)).toBe(1); // last night still counts
        expect(overdueDays({ deadline: new Date(2026, 5, 8, 12, 0, 0) }, now)).toBe(2);
        expect(overdueDays({ deadline: new Date(2026, 4, 11, 12, 0, 0) }, now)).toBe(30);
    });

    it('does not count a deadline that has not passed yet, or one later today', () => {
        expect(overdueDays({ deadline: new Date(2026, 5, 10, 18, 0, 0) }, now)).toBe(0);
        expect(overdueDays({ deadline: new Date(2026, 5, 20, 12, 0, 0) }, now)).toBe(0);
    });

    it('truncates to calendar days, matching the repeat counter', () => {
        // One minute past midnight is already a whole day; one minute before it is not.
        expect(overdueDays({ deadline: new Date(2026, 5, 9, 0, 1, 0) }, now)).toBe(1);
        expect(overdueDays({ deadline: new Date(2026, 5, 10, 23, 59, 0) }, now)).toBe(0);
    });

    it('returns 0 without a deadline, for a completed task, and for an unparsable date', () => {
        expect(overdueDays({}, now)).toBe(0);
        expect(overdueDays({ deadline: null }, now)).toBe(0);
        expect(overdueDays({ deadline: new Date(2026, 5, 1), completed: true }, now)).toBe(0);
        expect(overdueDays({ deadline: 'not a date' }, now)).toBe(0);
    });

    it('defaults to the system clock when no `now` is passed', () => {
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 3);
        yesterday.setHours(12, 0, 0, 0);
        expect(overdueDays({ deadline: yesterday })).toBe(3);
    });

    describe('materialised by recalculateTasks', () => {
        const cats = [{ slug: 'work', weight: 1, currentWeight: 1 }];

        it('writes the deadline-derived count onto every task', () => {
            const tasks = recalculateTasks([
                { id: 1, category_slug: 'work', deadline: new Date(2026, 5, 8, 12, 0, 0) },
                { id: 2, category_slug: 'work', deadline: new Date(2026, 5, 20, 12, 0, 0) },
            ], cats, {}, now);

            expect(tasks[0].days_overdue).toBe(2);
            expect(tasks[1].days_overdue).toBe(0);
        });

        it('prefers the repeat counter when it is larger, and never sums the two', () => {
            const tasks = recalculateTasks([
                {
                    id: 1, category_slug: 'work', repeat_type: 'interval', repeat_interval: 2,
                    last_completed_date: new Date(2026, 5, 4, 12, 0, 0), // due Jun 6 -> 4 missed
                    deadline: new Date(2026, 5, 9, 12, 0, 0), // 1 day overdue
                },
                {
                    id: 2, category_slug: 'work', repeat_type: 'interval', repeat_interval: 1,
                    last_completed_date: new Date(2026, 5, 8, 12, 0, 0), // due Jun 9 -> 1 missed
                    deadline: new Date(2026, 5, 5, 12, 0, 0), // 5 days overdue
                },
            ], cats, {}, now);

            expect(tasks[0].missed_count).toBe(4);
            expect(tasks[0].days_overdue).toBe(4); // not 5
            expect(tasks[1].missed_count).toBe(1);
            expect(tasks[1].days_overdue).toBe(5); // not 6
        });

        it('counts a repeat with no deadline by its missed occurrences', () => {
            const tasks = recalculateTasks([
                {
                    id: 1, category_slug: 'work', repeat_type: 'interval', repeat_interval: 2,
                    last_completed_date: new Date(2026, 5, 4, 12, 0, 0),
                },
            ], cats, {}, now);
            expect(tasks[0].days_overdue).toBe(4);
        });

        it('leaves a completed task at 0 even when its counter is stale', () => {
            const task = {
                id: 1, category_slug: 'work', completed: true,
                repeat_type: 'interval', repeat_interval: 2,
                last_completed_date: new Date(2026, 5, 4, 12, 0, 0),
                missed_count: 4, deadline: new Date(2026, 5, 1, 12, 0, 0),
            };
            recalculateTasks([task], cats, {}, now);
            expect(task.days_overdue).toBe(0);
        });

        it('is present even when the category list is empty', () => {
            // Same reason as `postponed`: the charts read this field unconditionally.
            const tasks = recalculateTasks([
                { id: 1, category_slug: 'work', deadline: new Date(2026, 5, 8, 12, 0, 0) },
            ], [], {}, now);
            expect(tasks[0].days_overdue).toBe(2);
        });

        it('reads the repeat counter even when the category list is empty', () => {
            const tasks = recalculateTasks([
                {
                    id: 1, category_slug: 'work', repeat_type: 'interval', repeat_interval: 2,
                    last_completed_date: new Date(2026, 5, 4, 12, 0, 0),
                },
            ], [], {}, now);
            expect(tasks[0].missed_count).toBe(4);
            expect(tasks[0].days_overdue).toBe(4);
        });
    });
});
