import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';

/**
 * `filteredTasks` used to hard-code the order of both lists (#155). It now delegates to
 * `task-sort`, and the store fields are what the sort bar writes to.
 */
describe('Balance Store — archive and hidden sorting (#155)', () => {
    const at = (hoursAgo) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        useTasksStore().tasks = [
            { id: 1, title: 'Zulu', category_slug: 'work', completed: true, completed_at: at(1), created_at: at(5) },
            { id: 2, title: 'alpha', category_slug: 'work', completed: true, completed_at: at(3), created_at: at(4) },
            { id: 3, title: 'Mike', category_slug: 'work', completed: true, completed_at: at(2), created_at: at(6) },
            { id: 4, title: 'Zulu', category_slug: 'work', completed: false, hidden_until: at(-1), created_at: at(5) },
            { id: 5, title: 'alpha', category_slug: 'work', completed: false, hidden_until: at(-3), created_at: at(4) },
            { id: 6, title: 'Mike', category_slug: 'work', completed: false, hidden_until: at(-2), created_at: at(6) },
        ];
    });

    it('starts on the order both lists had before the control existed', () => {
        expect(store.archiveSort).toBe('completed_desc');
        expect(store.hiddenSort).toBe('appears_asc');
    });

    it.each([
        ['completed_desc', [1, 3, 2]],
        ['created_desc', [2, 1, 3]],
        ['name_asc', [2, 3, 1]],
    ])('archive: %s', (key, expected) => {
        store.filterCat = 'archive';
        store.archiveSort = key;
        expect(store.filteredTasks.map(t => t.id)).toEqual(expected);
    });

    it.each([
        ['appears_asc', [4, 6, 5]],
        ['created_desc', [5, 4, 6]],
        ['name_asc', [5, 6, 4]],
    ])('hidden: %s', (key, expected) => {
        store.filterCat = 'hidden';
        store.hiddenSort = key;
        expect(store.filteredTasks.map(t => t.id)).toEqual(expected);
    });

    it('keeps the two choices independent of each other', () => {
        store.filterCat = 'archive';
        store.archiveSort = 'name_asc';
        store.filterCat = 'hidden';
        expect(store.filteredTasks.map(t => t.id)).toEqual([4, 6, 5]);
        expect(store.hiddenSort).toBe('appears_asc');
    });

    it('does not sort the other sections', () => {
        store.filterCat = 'all';
        store.archiveSort = 'name_asc';
        // The active list is priority-ordered and ignores the archive key entirely.
        expect(store.filteredTasks.length).toBe(0);
    });
});
