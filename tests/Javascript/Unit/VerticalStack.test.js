import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('Balance Store - Vertical Stack Getters', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('correctly splits tasks into focus, plans and routine groups', () => {
        const store = useBalanceStore();
        
        // Mock tasks
        store.tasks = [
            { id: 1, title: 'Active Task', ha: false, completed: false },
            { id: 2, title: 'Routine Task', ha: true, completed: false },
            { id: 3, title: 'Postponed Task', ha: false, completed: false, postpone_until: '2099-01-01' },
            { id: 4, title: 'Completed Task', ha: false, completed: true }
        ];

        // Focus: Not HA, Not Postponed
        expect(store.focusTasks.length).toBe(1);
        expect(store.focusTasks[0].id).toBe(1);

        // Routine: HA, Not Postponed
        expect(store.routineTasks.length).toBe(1);
        expect(store.routineTasks[0].id).toBe(2);

        // Plans: Postponed
        expect(store.plansTasks.length).toBe(1);
        expect(store.plansTasks[0].id).toBe(3);
    });
});
