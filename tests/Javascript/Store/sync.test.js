import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

describe('Balance Store - Sync Logic', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('performs full sync when lastSync is empty', async () => {
        const store = useBalanceStore();
        const mockData = {
            tasks: { updated: [{ id: 1, title: 'Task 1' }], deleted: [] },
            categories: { updated: [{ id: 1, name: 'Cat 1' }], deleted: [] },
            settings: { theme: 'dark' },
            server_time: '2026-01-01T00:00:00Z'
        };
        
        axios.get.mockResolvedValue({ data: mockData });

        await store.sync();

        expect(store.tasks.length).toBe(1);
        expect(store.theme).toBe('dark');
        expect(store.lastSync).toBe('2026-01-01T00:00:00Z');
        expect(localStorage.getItem('last_sync')).toBe('2026-01-01T00:00:00Z');
    });

    it('performs incremental sync and merges data', async () => {
        const store = useBalanceStore();
        store.tasks = [{ id: 1, title: 'Old Title' }];
        store.lastSync = '2026-01-01T00:00:00Z';

        const mockDelta = {
            tasks: { 
                updated: [{ id: 1, title: 'New Title' }, { id: 2, title: 'Brand New' }], 
                deleted: [] 
            },
            categories: { updated: [], deleted: [] },
            server_time: '2026-01-01T01:00:00Z'
        };

        axios.get.mockResolvedValue({ data: mockDelta });

        await store.sync();

        expect(store.tasks.length).toBe(2);
        expect(store.tasks.find(t => t.id === 1).title).toBe('New Title');
        expect(store.lastSync).toBe('2026-01-01T01:00:00Z');
    });

    it('removes deleted items during sync', async () => {
        const store = useBalanceStore();
        store.tasks = [{ id: 1 }, { id: 2 }];
        store.lastSync = '2026-01-01T00:00:00Z';

        const mockDelta = {
            tasks: { updated: [], deleted: [1] },
            categories: { updated: [], deleted: [] },
            server_time: '2026-01-01T01:00:00Z'
        };

        axios.get.mockResolvedValue({ data: mockDelta });

        await store.sync();

        expect(store.tasks.length).toBe(1);
        expect(store.tasks[0].id).toBe(2);
    });
});
