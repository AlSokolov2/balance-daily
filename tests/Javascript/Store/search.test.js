import { describe, it, expect, beforeEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('Balance Store - Search Logic', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('filters tasks by title', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'Buy milk', category_slug: 'all' },
            { id: 2, title: 'Clean room', category_slug: 'all' },
            { id: 3, title: 'Feed cat', category_slug: 'all' }
        ];

        store.searchQuery = 'milk';
        expect(store.filteredTasks.length).toBe(1);
        expect(store.filteredTasks[0].id).toBe(1);
    });

    it('filters tasks by notes', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'Task 1', notes: 'Important thing', category_slug: 'all' },
            { id: 2, title: 'Task 2', notes: 'Normal thing', category_slug: 'all' }
        ];

        store.searchQuery = 'important';
        expect(store.filteredTasks.length).toBe(1);
        expect(store.filteredTasks[0].id).toBe(1);
    });

    it('is case insensitive', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'APPLE', category_slug: 'all' },
            { id: 2, title: 'banana', category_slug: 'all' }
        ];

        store.searchQuery = 'apple';
        expect(store.filteredTasks.length).toBe(1);
        expect(store.filteredTasks[0].id).toBe(1);
    });

    it('returns all tasks when query is empty', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'A', category_slug: 'all' },
            { id: 2, title: 'B', category_slug: 'all' }
        ];

        store.searchQuery = '';
        expect(store.filteredTasks.length).toBe(2);
    });
});
