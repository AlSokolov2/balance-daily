import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

describe('Balance Store - Advanced Coverage', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        
        // Use stubGlobal for cleaner mocking in Vitest
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
        vi.stubGlobal('setInterval', vi.fn());
        vi.stubGlobal('clearInterval', vi.fn());
        vi.stubGlobal('alert', vi.fn());
        
        // Mock URLSearchParams and history
        const mockLocation = { search: '' };
        vi.stubGlobal('location', mockLocation);
        vi.stubGlobal('history', { replaceState: vi.fn() });

        // Ensure atob works
        vi.stubGlobal('atob', (s) => Buffer.from(s, 'base64').toString('binary'));
    });

    it('init exchanges code from URL for token', async () => {
        window.location.search = '?code=url-code';
        const store = useBalanceStore();
        axios.post.mockResolvedValueOnce({ data: { token: 'exchanged-token' } });
        axios.get.mockResolvedValueOnce({ data: { name: 'URL User' } });
        axios.get.mockResolvedValueOnce({ data: { server_time: 'now', tasks: { updated: [] }, categories: { updated: [] } } });

        await store.init();

        expect(axios.post).toHaveBeenCalledWith('auth/exchange-code', { code: 'url-code' });
        expect(store.token).toBe('exchanged-token');
        expect(window.history.replaceState).toHaveBeenCalled();
    });

    it('init handles code exchange failure gracefully', async () => {
        window.location.search = '?code=bad-code';
        const store = useBalanceStore();
        // Force the exchange-code POST to reject
        axios.post.mockImplementationOnce(() => Promise.reject(new Error('Network error')));
        const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await store.init();

        expect(axios.post).toHaveBeenCalledWith('auth/exchange-code', { code: 'bad-code' });
        expect(store.token).toBeNull();
        expect(window.history.replaceState).toHaveBeenCalled();

        consoleSpy.mockRestore();
    });

    it('sync merges data and updates lastSync', async () => {
        const store = useBalanceStore();
        const mockData = {
            tasks: { updated: [{ id: 10, title: 'Sync Task' }], deleted: [] },
            categories: { updated: [], deleted: [] },
            server_time: '2026-06-07T12:00:00Z',
            settings: { theme: 'dark', locale: 'en' }
        };
        axios.get.mockResolvedValue({ data: mockData });

        await store.sync(true);

        expect(store.tasks).toHaveLength(1);
        expect(store.lastSync).toBe(mockData.server_time);
        expect(store.theme).toBe('dark');
    });

    it('subscribeToPush calls browser API and backend', async () => {
        const store = useBalanceStore();
        vi.stubGlobal('__VAPID_PUBLIC_KEY__', 'test-key');
        
        const mockSub = {
            endpoint: 'https://push.com',
            toJSON: () => ({ endpoint: 'https://push.com', keys: { p256dh: 'p', auth: 'a' } })
        };
        
        const subscribeSpy = vi.fn().mockResolvedValue(mockSub);
        
        // Mock navigator
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: { subscribe: subscribeSpy }
                })
            }
        });

        await store.subscribeToPush();

        expect(subscribeSpy).toHaveBeenCalled();
        expect(axios.post).toHaveBeenCalledWith('push-subscriptions', expect.anything());
        expect(store.notificationsEnabled).toBe(true);
    });

    it('restoreTask and returnNow update task state', async () => {
        const store = useBalanceStore();
        store.tasks = [{ id: 1, title: 'Task', completed: true }];
        axios.put.mockResolvedValue({ data: { id: 1, completed: false } });

        await store.restoreTask(1);
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ completed: false, postpone_until: null }));

        await store.returnNow(1);
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ hidden_until: null, postpone_until: null }));
    });

    it('deleteTask removes task and recalculates', async () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'Task 1' },
            { id: 2, title: 'Task 2' }
        ];
        axios.delete.mockResolvedValue({});

        await store.deleteTask(1);
        expect(axios.delete).toHaveBeenCalledWith('tasks/1');
        expect(store.tasks).toHaveLength(1);
        expect(store.tasks[0].id).toBe(2);
    });

    it('archiveTask marks task completed without history', async () => {
        const store = useBalanceStore();
        store.tasks = [{ id: 1, title: 'Task 1', category_slug: 'chor' }];
        store.categories = [{ slug: 'chor', color: '#fff', weight: 0.5, currentWeight: 0.5 }];
        axios.put.mockResolvedValue({ data: { id: 1, completed: true } });

        await store.archiveTask(1);
        expect(axios.put).toHaveBeenCalledWith('tasks/1', {
            completed: true,
            completed_at: expect.any(String),
            _skip_history: true,
        });
        expect(store.tasks).toHaveLength(0);
    });
});
