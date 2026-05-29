import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('Balance Store - Counters', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('calculates counts correctly for different task states', () => {
        const store = useBalanceStore();
        const now = new Date();
        const tomorrow = new Date(now);
        tomorrow.setDate(tomorrow.getDate() + 1);

        store.tasks = [
            { id: 1, completed: false, category_slug: 'work' },
            { id: 2, completed: false, category_slug: 'work' },
            { id: 3, completed: true, category_slug: 'work' },
            { id: 4, completed: false, category_slug: 'life', hidden_until: tomorrow.toISOString() },
            { id: 5, completed: false, category_slug: 'life' },
        ];

        const counts = store.counts;
        
        expect(counts.all).toBe(3); // id 1, 2, 5 are active
        expect(counts.archive).toBe(1); // id 3 is completed
        expect(counts.hidden).toBe(1); // id 4 is hidden until tomorrow
        expect(counts.byCat['work']).toBe(2); // id 1, 2
        expect(counts.byCat['life']).toBe(1); // id 5
    });

    it('returns zero counts when tasks are empty', () => {
        const store = useBalanceStore();
        store.tasks = [];
        
        const counts = store.counts;
        expect(counts.all).toBe(0);
        expect(counts.archive).toBe(0);
        expect(counts.hidden).toBe(0);
        expect(Object.keys(counts.byCat).length).toBe(0);
    });
});
