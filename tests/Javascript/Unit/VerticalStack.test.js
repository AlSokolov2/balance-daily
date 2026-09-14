import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';

describe('Balance Store - Vertical Stack Getters', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('correctly splits tasks into focus, plans and routine groups', () => {
        const store = useBalanceStore();

        // `postponed` is materialised by the priority engine, and the getters read that flag
        // rather than re-deriving the predicate — so the fixtures below state the flag itself.
        useTasksStore().tasks = [
            { id: 1, title: 'Active Task', ha: false, completed: false, postponed: false },
            { id: 2, title: 'Routine Task', ha: true, completed: false, postponed: false },
            { id: 3, title: 'Postponed Task', ha: false, completed: false, postponed: true },
            { id: 4, title: 'Completed Task', ha: false, completed: true, postponed: false }
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

    it('moves a task out of plans once its postpone_until has passed', () => {
        const store = useBalanceStore();
        const tasksStore = useTasksStore();

        tasksStore.categories = [{ slug: 'chor', weight: 1, hide_until: null }];
        tasksStore.tasks = [
            { id: 1, title: 'Postponed', category_slug: 'chor', ha: false, completed: false, importance: 2, postpone_until: '2099-01-01T00:00:00Z' }
        ];

        // Explicit `now` keeps the assertion independent of the machine's clock and timezone.
        tasksStore.recalculateAll(new Date('2026-01-01T00:00:00Z'));
        expect(store.plansTasks.map(t => t.id)).toEqual([1]);

        // The same task, seen after its postpone instant: the pulse re-materialises the flag
        // and the getters follow, with no sync and no reload (#161).
        tasksStore.recalculateAll(new Date('2100-01-01T00:00:00Z'));
        expect(tasksStore.tasks[0].postponed).toBe(false);
        expect(store.plansTasks).toHaveLength(0);
        expect(store.focusTasks.map(t => t.id)).toEqual([1]);
    });
});
