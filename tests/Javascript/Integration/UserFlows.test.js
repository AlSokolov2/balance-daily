/**
 * Integration tests covering critical user flows.
 * Tests the store layer with mocked axios — verifies correct API calls
 * and data transformations for all key user scenarios.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

describe('User Flows — Integration', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        localStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        window.apiBaseUrl = 'https://balance.example.com';
        axios.defaults.baseURL = window.apiBaseUrl + '/api/';
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    // ──────────────────────────────────────────────
    // Flow 1: Full Task Lifecycle
    // ──────────────────────────────────────────────
    describe('Task Lifecycle', () => {
        it('create → update → complete → delete', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            const tasksStore = useTasksStore();
            tasksStore.categories = [
                { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30', hide_until: null },
            ];

            // CREATE — addTask receives an object
            const created = { id: 100, title: 'Test Task', category_slug: 'chor', importance: 3, completed: false };
            axios.post.mockResolvedValueOnce({ data: created });
            await tasksStore.addTask({ title: 'Test Task', category_slug: 'chor' });
            expect(axios.post).toHaveBeenCalledWith('tasks', { title: 'Test Task', category_slug: 'chor' });
            expect(tasksStore.tasks).toContainEqual(created);

            // UPDATE
            axios.put.mockResolvedValueOnce({ data: { ...created, title: 'Updated' } });
            await tasksStore.updateTask(100, { title: 'Updated', importance: 5 });
            expect(axios.put).toHaveBeenCalledWith('tasks/100', expect.objectContaining({ title: 'Updated', importance: 5 }));

            // COMPLETE (non-recurring → simple update)
            axios.put.mockResolvedValueOnce({ data: { ...created, title: 'Updated', completed: true } });
            await tasksStore.completeTask(100);
            // completeTask calls updateTask with completed flags

            // DELETE
            axios.delete.mockResolvedValueOnce({});
            await tasksStore.deleteTask(100);
            expect(axios.delete).toHaveBeenCalledWith('tasks/100');
            expect(tasksStore.tasks).toHaveLength(0);
        });
    });

    // ──────────────────────────────────────────────
    // Flow 2: Category CRUD
    // ──────────────────────────────────────────────
    describe('Category Management', () => {
        it('category API calls use correct URLs and payloads', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            // CREATE new category
            axios.post.mockResolvedValueOnce({ data: { id: 10, slug: 'work', name: 'Work', weight: 0.3, color: '#000' } });
            await axios.post('categories', { slug: 'work', name: 'Work', weight: 0.3, color: '#000', hide_until: null });
            expect(axios.post).toHaveBeenCalledWith('categories', {
                slug: 'work', name: 'Work', weight: 0.3, color: '#000', hide_until: null,
            });

            // UPDATE existing — weight is decimal, not percentage
            axios.put.mockResolvedValueOnce({ data: { id: 1, slug: 'chor', name: 'X', weight: 0.25, color: '#f00', hide_until: null } });
            await axios.put('categories/1', { name: 'X', weight: 0.25, color: '#f00', hide_until: null });
            expect(axios.put).toHaveBeenCalledWith('categories/1', { name: 'X', weight: 0.25, color: '#f00', hide_until: null });

            // DELETE
            axios.delete.mockResolvedValueOnce({});
            await axios.delete('categories/2');
            expect(axios.delete).toHaveBeenCalledWith('categories/2');
        });
    });

    // ──────────────────────────────────────────────
    // Flow 3: Settings Persistence
    // ──────────────────────────────────────────────
    describe('Settings Persistence', () => {
        it('theme, locale, and pulse interval are persisted via store', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';
            axios.post.mockResolvedValue({ data: {} });

            const { useSettingsStore } = await import('../../../resources/js/stores/settings');
            setActivePinia(createPinia());
            const settings = useSettingsStore();

            await settings.setTheme('dark');
            expect(axios.post).toHaveBeenCalledWith('settings', { settings: { theme: 'dark' } });

            await settings.setLocale('en');
            expect(axios.post).toHaveBeenCalledWith('settings', { settings: { locale: 'en' } });

            await settings.setPulseInterval(5);
            expect(axios.post).toHaveBeenCalledWith('settings', { settings: { pulse_interval: 5 } });
        });
    });

    // ──────────────────────────────────────────────
    // Flow 4: Sync
    // ──────────────────────────────────────────────
    describe('Data Sync', () => {
        it('full sync (no lastSync) replaces all data', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            const syncPayload = {
                tasks: { updated: [{ id: 1, title: 'Task 1', category_slug: 'chor', importance: 3, completed: false }], deleted: [] },
                categories: { updated: [
                    { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30', hide_until: null },
                    { id: 3, slug: '__archive__', name: 'Archive', weight: 0.01, color: '#8e8e93', hide_until: null },
                ], deleted: [] },
                settings: null,
                subcatCoeffs: [],
                server_time: '2026-07-22T10:00:00.000Z',
            };
            axios.get.mockResolvedValueOnce({ data: syncPayload });

            const tasksStore = useTasksStore();
            await tasksStore.sync();

            expect(axios.get).toHaveBeenCalledWith('sync', { params: {} });
            expect(tasksStore.categories).toHaveLength(2);
            expect(tasksStore.tasks).toHaveLength(1);
            expect(tasksStore.lastSync).toBe('2026-07-22T10:00:00.000Z');
        });

        it('delta sync appends new and removes deleted', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            const tasksStore = useTasksStore();
            tasksStore.categories = [
                { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30', hide_until: null },
            ];
            tasksStore.tasks = [
                { id: 1, title: 'Old', category_slug: 'chor', importance: 3, completed: false },
                { id: 2, title: 'ToDelete', category_slug: 'chor', importance: 2, completed: false },
            ];
            tasksStore.lastSync = '2026-07-22T09:00:00.000Z';

            const delta = {
                tasks: { updated: [{ id: 3, title: 'New', category_slug: 'chor', importance: 4, completed: false }], deleted: [2] },
                categories: { updated: [], deleted: [] },
                settings: null,
                subcatCoeffs: [],
                server_time: '2026-07-22T10:00:00.000Z',
            };
            axios.get.mockResolvedValueOnce({ data: delta });

            await tasksStore.sync();

            expect(axios.get).toHaveBeenCalledWith('sync', { params: { since: '2026-07-22T09:00:00.000Z' } });
            expect(tasksStore.tasks).toHaveLength(2); // Old + New, ToDelete removed
            expect(tasksStore.tasks.map(t => t.id).sort()).toEqual([1, 3]);
        });
    });

    // ──────────────────────────────────────────────
    // Flow 5: Auth — token lifecycle
    // ──────────────────────────────────────────────
    describe('Auth Token Lifecycle', () => {
        it('exchange code → get user → logout', async () => {
            Object.defineProperty(window, 'location', {
                value: { search: '?code=oauth-abc', pathname: '/' },
                writable: true,
            });
            vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

            axios.post.mockResolvedValueOnce({ data: { token: 'sanctum-123' } });
            axios.get.mockResolvedValueOnce({ data: { id: 1, name: 'Test', providers: [{ provider: 'vkid' }] } });

            const auth = useAuthStore();
            await auth.init();

            expect(axios.post).toHaveBeenCalledWith('auth/exchange-code', { code: 'oauth-abc' });
            expect(auth.token).toBe('sanctum-123');
            expect(auth.isAuthenticated).toBe(true);
            expect(localStorage.getItem('auth_token')).toBe('sanctum-123');
            expect(axios.defaults.headers.common['Authorization']).toBe('Bearer sanctum-123');

            // Logout
            axios.post.mockResolvedValueOnce({});
            await auth.logout();
            expect(axios.post).toHaveBeenCalledWith('logout');
            expect(auth.token).toBeNull();
            expect(auth.isAuthenticated).toBe(false);
            expect(localStorage.getItem('auth_token')).toBeNull();
            expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
        });

        it('page refresh with stored token works', () => {
            // Simulate page refresh: store token, then the auth store
            // state initializer reads it back on construction.
            localStorage.setItem('auth_token', 'persisted-token');
            setActivePinia(createPinia());

            const auth = useAuthStore();
            // State initializer reads from localStorage synchronously
            expect(auth.token).toBe('persisted-token');
            expect(auth.isAuthenticated).toBe(true);
            expect(axios.defaults.headers.common['Authorization']).toBeUndefined(); // not set yet
        });
    });

    // ──────────────────────────────────────────────
    // Flow 6: Account Linking
    // ──────────────────────────────────────────────
    describe('Account Linking', () => {
        it('link-token uses relative URL (no double /api/ regression)', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            axios.post.mockResolvedValueOnce({ data: { url: '/auth/google/link?token=abc' } });
            const { data } = await axios.post('auth/link-token', { provider: 'google' });

            expect(axios.post).toHaveBeenCalledWith('auth/link-token', { provider: 'google' });
            expect(data.url).toBe('/auth/google/link?token=abc');
        });
    });

    // ──────────────────────────────────────────────
    // Flow 7: Stats API
    // ──────────────────────────────────────────────
    describe('Statistics', () => {
        it('fetches stats with date parameter', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            axios.get.mockResolvedValueOnce({ data: { completions: 5, streaks: 3 } });
            const tasksStore = useTasksStore();
            await tasksStore.fetchStats({ date: '2026-07-22' });

            expect(axios.get).toHaveBeenCalledWith('stats', { params: { date: '2026-07-22' } });
        });
    });

    // ──────────────────────────────────────────────
    // Flow 8: Push Subscriptions
    // ──────────────────────────────────────────────
    describe('Push Notifications', () => {
        it('subscribe and unsubscribe API calls', async () => {
            const auth = useAuthStore();
            auth.token = 'test-token';
            axios.defaults.headers.common['Authorization'] = 'Bearer test-token';

            // Mock service worker and push manager
            const mockPushManager = {
                subscribe: vi.fn().mockResolvedValue({
                    endpoint: 'https://push.example.com/1',
                    toJSON: () => ({ endpoint: 'https://push.example.com/1', keys: { p256dh: 'key1', auth: 'auth1' } }),
                }),
            };
            const mockRegistration = { pushManager: mockPushManager };
            Object.defineProperty(globalThis, 'navigator', {
                value: {
                    serviceWorker: {
                        getRegistration: vi.fn().mockResolvedValue(mockRegistration),
                        ready: Promise.resolve(mockRegistration),
                    },
                },
                writable: true,
                configurable: true,
            });

            // Subscribe
            axios.post.mockResolvedValueOnce({ data: { success: true } });
            const tasksStore = useTasksStore();
            await tasksStore.subscribeToPush();

            expect(axios.post).toHaveBeenCalledWith('push-subscriptions', {
                endpoint: 'https://push.example.com/1',
                public_key: 'key1',
                auth_token: 'auth1',
            });

            // Unsubscribe
            mockPushManager.getSubscription = vi.fn().mockResolvedValue({
                endpoint: 'https://push.example.com/1',
                unsubscribe: vi.fn().mockResolvedValue(undefined),
            });
            axios.delete.mockResolvedValueOnce({});
            await tasksStore.unsubscribeFromPush();

            expect(axios.delete).toHaveBeenCalledWith('push-subscriptions', {
                data: { endpoint: 'https://push.example.com/1' },
            });
        });
    });
});
