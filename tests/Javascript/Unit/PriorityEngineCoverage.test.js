import { describe, it, expect } from 'vitest';
import { calcPriority, isCategoryPostponed, recalculateTasks, isEffectivelyPostponed } from '../../../resources/js/utils/priority-engine';

describe('Priority Engine Exhaustive Branch Coverage', () => {
    const catsMap = {
        work: { slug: 'work', currentWeight: 0.5, weight: 0.5 }
    };

    it('covers default parameters and missing catsMap entries', () => {
        // calcPriority default subcatCoeffs = {}
        const t = { category_slug: 'work', importance: 1 };
        expect(calcPriority(t, catsMap)).toBeDefined();

        // Missing category in catsMap (Line 16 branch)
        expect(calcPriority({ category_slug: 'missing' }, {})).toBe(0);

        // isCategoryPostponed default now = new Date()
        expect(isCategoryPostponed({ hide_until: '00:01' })).toBeDefined();

        // isEffectivelyPostponed default now = new Date()
        expect(isEffectivelyPostponed(t, catsMap)).toBeDefined();
    });

    it('covers isEffectivelyPostponed branch in calcPriority', () => {
        // Line 25: if (isEffectivelyPostponed(task, catsMap)) { s *= 0.7; }
        // Use true real-time future to avoid race conditions
        const realFutureDate = new Date(Date.now() + 86400000 * 2).toISOString();
        
        // Task explicitly postponed
        const tPostponed = { category_slug: 'work', importance: 1, postpone_until: realFutureDate };
        // expected: 0.5 * 1 * 0.7 = 0.35
        expect(calcPriority(tPostponed, catsMap)).toBeCloseTo(0.35);

        // Task in a postponed category
        const catsMapPostponed = {
            work: { slug: 'work', currentWeight: 0.5, weight: 0.5, hide_until: '23:59' }
        };
        const tCatPostponed = { category_slug: 'work', importance: 1 };
        
        // To prevent flakiness at midnight, we only assert if the test runs before 23:59
        const currentHour = new Date().getHours();
        const currentMin = new Date().getMinutes();
        if (currentHour < 23 || (currentHour === 23 && currentMin < 59)) {
            expect(calcPriority(tCatPostponed, catsMapPostponed)).toBeCloseTo(0.35);
        }
    });

    it('exhausts recalculateTasks repeat logic branches (Line 71)', () => {
        const tasks = [
            { id: 1, completed: true, repeat_type: 'interval' }, // Branch 1: completed is true
            { id: 2, completed: false, repeat_type: 'none' },    // Branch 2: repeat_type is none
            { id: 3, completed: false, repeat_type: 'interval', last_completed_date: null } // Branch 3: last_completed_date is null
        ];
        const categories = [{ slug: 'work', weight: 0.5 }];
        
        recalculateTasks(tasks, categories, {});
        expect(tasks[0].missed_count).toBeUndefined();
        expect(tasks[1].missed_count).toBeUndefined();
        expect(tasks[2].missed_count).toBeUndefined();
    });

    it('covers all deadline proximity branches in calcPriority', () => {
        const now = new Date();
        now.setHours(12, 0, 0, 0);
        
        const cases = [
            { d: -1, expected: 5 }, // Past
            { d: 0, expected: 4 },  // Today
            { d: 1, expected: 3 },  // Soon (1d)
            { d: 2, expected: 3 },  // Soon (2d)
            { d: 5, expected: 1 },  // Week (5d)
            { d: 7, expected: 1 },  // Week (7d)
            { d: 10, expected: 0 }  // Far future
        ];

        cases.forEach(({ d, expected }) => {
            const deadline = new Date(now.getTime() + d * 86400000).toISOString();
            const t = { category_slug: 'work', importance: 1, deadline };
            expect(calcPriority(t, catsMap, {})).toBeCloseTo(0.5 + expected);
        });
    });

    it('covers weekly repeat loop termination and missed_count calculation', () => {
        const now = new Date('2026-06-12T12:00:00Z'); // Friday (5)
        const last = new Date('2026-06-11T12:00:00Z'); // Thursday (4)

        const tasks = [
            {
                id: 1,
                completed: false,
                repeat_type: 'weekly',
                repeat_days: [1], // Monday only (break never hit)
                last_completed_date: last.toISOString(),
                category_slug: 'work'
            },
            {
                id: 2,
                completed: false,
                repeat_type: 'weekly',
                repeat_days: [], // No days (break never hit)
                last_completed_date: last.toISOString(),
                category_slug: 'work'
            }
        ];
        const categories = [{ slug: 'work', weight: 0.5 }];
        
        recalculateTasks(tasks, categories, {}, now);
        // If due stays at 'last', missed_count should be calculated
        expect(tasks[0].missed_count).toBeDefined();
    });

    it('covers ternary operator for completed tasks in recalculateTasks (Line 119)', () => {
        const tasks = [
            { id: 1, completed: true, category_slug: 'work' },
            { id: 2, completed: false, category_slug: 'work' }
        ];
        const categories = [{ slug: 'work', weight: 0.5 }];
        
        recalculateTasks(tasks, categories, {});
        expect(tasks[0].calculatedPriority).toBe(0);
        expect(tasks[1].calculatedPriority).toBeGreaterThan(0);
    });

    it('covers dynamic weights and normalization edge cases', () => {
        const now = new Date('2026-06-12T12:00:00Z');
        const tasks = [
            { id: 1, category_slug: 'work', completed: true, completed_at: now.toISOString() },
            { id: 2, category_slug: 'other', completed: false }
        ];
        const categories = [
            { slug: '__archive__', weight: '0.1' }, // Skipped for 1.5x boost
            { slug: 'work', weight: '0.5' },        // Has completion today, no boost
            { slug: 'other', weight: '0.5' },       // No completion today, gets 1.5x boost
            { slug: 'zero', weight: '0.0' }         // Zero weight test
        ];
        
        recalculateTasks(tasks, categories, {}, now);
        
        // Total weight logic
        const total = categories.reduce((acc, c) => acc + c.currentWeight, 0);
        expect(total).toBeCloseTo(1.0);
    });

    it('covers dynamic weights and normalization edge cases', () => {
        expect(isCategoryPostponed(null)).toBe(false);
        expect(isCategoryPostponed({ slug: 'test' })).toBe(false);
        expect(isCategoryPostponed({ hide_until: 'abc:def' })).toBe(false);
        
        const now = new Date(2026, 5, 12, 10, 0); // 10:00
        expect(isCategoryPostponed({ hide_until: '12:00' }, now)).toBe(true);
        expect(isCategoryPostponed({ hide_until: '08:00' }, now)).toBe(false);
    });
});
