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

    it('init handles token in URL', async () => {
        window.location.search = '?token=url-token';
        const store = useBalanceStore();
        axios.get.mockResolvedValue({ data: { name: 'URL User' } });
        axios.get.mockImplementation((url) => {
            if (url === 'sync') return Promise.resolve({ data: { server_time: 'now', tasks: { updated: [] }, categories: { updated: [] } } });
            return Promise.resolve({ data: { name: 'URL User' } });
        });
        
        await store.init();
        
        expect(store.token).toBe('url-token');
        expect(window.history.replaceState).toHaveBeenCalled();
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
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ completed: false }));

        await store.returnNow(1);
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ hidden_until: null }));
    });
});
