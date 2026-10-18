/**
 * #205: a future `hidden_until` must outrank `completed`.
 *
 * The user can deliberately set both — "done, but keep it out of sight until
 * that date" — and expects the task in the hidden list, not the archive.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';

describe('hidden vs archive precedence (#205)', () => {
    const at = (days) => new Date(Date.now() + days * 86_400_000).toISOString();
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        useTasksStore().tasks = [
            { id: 1, title: 'Active', category_slug: 'work', completed: false, calculatedPriority: 1 },
            { id: 2, title: 'Done', category_slug: 'work', completed: true, completed_at: at(-1), calculatedPriority: 1 },
            { id: 3, title: 'Done later', category_slug: 'work', completed: true, hidden_until: at(1), completed_at: at(-2), calculatedPriority: 1 },
            { id: 4, title: 'Hidden', category_slug: 'work', completed: false, hidden_until: at(2), calculatedPriority: 1 },
            { id: 5, title: 'Done, date passed', category_slug: 'work', completed: true, hidden_until: at(-1), completed_at: at(-3), calculatedPriority: 1 },
        ];
    });

    it('keeps a completed task with a future date in the hidden list', () => {
        store.filterCat = 'hidden';

        expect(store.filteredTasks.map(t => t.id)).toEqual([3, 4]);
    });

    it('keeps a completed task with a future date out of the archive', () => {
        store.filterCat = 'archive';

        expect(store.filteredTasks.map(t => t.id)).toEqual([2, 5]);
    });

    it('returns a completed task to the archive once its date has passed', () => {
        store.filterCat = 'archive';

        expect(store.filteredTasks.map(t => t.id)).toContain(5);
    });

    it('shows neither hidden nor completed tasks in the active list', () => {
        store.filterCat = 'all';

        expect(store.filteredTasks.map(t => t.id)).toEqual([1]);
    });
});
