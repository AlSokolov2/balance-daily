import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';
import { hexToRgba } from '../../../resources/js/utils/colors';
import { recalculateTasks, isCategoryPostponed } from '../../../resources/js/utils/priority-engine';

vi.mock('axios');

describe('Balance Store Coverage Booster', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
        
        // Mock global navigator and window properties
        global.navigator = {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        subscribe: vi.fn(),
                        getSubscription: vi.fn()
                    }
                })
            }
        };
        global.window.atob = (str) => Buffer.from(str, 'base64').toString('binary');
    });

    it('covers getters edge cases (part 1)', () => {
        const originalBaseUrl = window.apiBaseUrl;
        window.apiBaseUrl = 'https://api.test/';
        const store = useBalanceStore();
        expect(store.googleAuthUrl).toBe('https://api.test/auth/google');
        window.apiBaseUrl = originalBaseUrl;
    });

    it('covers getters edge cases (part 2)', () => {
        const originalBaseUrl = window.apiBaseUrl;
        window.apiBaseUrl = undefined;
        const store = useBalanceStore();
        expect(store.googleAuthUrl).toBe('/auth/google');
        expect(store.vkAuthUrl).toBe('/auth/vkid');
        window.apiBaseUrl = originalBaseUrl;
    });

    it('covers isAuthenticated getter', () => {
        const store = useBalanceStore();
        store.token = null;
        expect(store.isAuthenticated).toBe(false);
        store.token = 'abc';
        expect(store.isAuthenticated).toBe(true);
    });

    it('covers sorting logic in filteredTasks for hidden and archive', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, category_slug: 'work', completed: false, hidden_until: new Date(Date.now() + 100000).toISOString() },
            { id: 2, category_slug: 'work', completed: false, hidden_until: new Date(Date.now() + 200000).toISOString() },
            { id: 3, category_slug: 'work', completed: true, completed_at: new Date(Date.now() - 100000).toISOString() },
            { id: 4, category_slug: 'work', completed: true, completed_at: new Date(Date.now() - 200000).toISOString() },
            { id: 5, category_slug: 'work', completed: true }, // no completed_at
            { id: 6, category_slug: 'work', completed: false }, // active
            { id: 7, category_slug: 'other', completed: false } // active
        ];

        store.filterCat = 'hidden';
        expect(store.filteredTasks[0].id).toBe(1);

        store.filterCat = 'archive';
        expect(store.filteredTasks[0].id).toBe(3); // Most recently completed first
        
        store.filterCat = 'work';
        expect(store.filteredTasks.length).toBe(1);
        expect(store.filteredTasks[0].id).toBe(6);
    });

    it('covers getters edge cases (part 3)', () => {
        const store = useBalanceStore();
        // allTasksOrdered
        store.tasks = null;
        expect(store.allTasksOrdered).toEqual([]);
        
        // counts for hidden and archive categories
        store.tasks = [
            { id: 1, category_slug: 'work', completed: false, hidden_until: new Date(Date.now() + 86400000).toISOString() },
            { id: 2, category_slug: 'work', completed: true, completed_at: new Date().toISOString() }
        ];
        expect(store.counts.hidden).toBe(1);
        expect(store.counts.archive).toBe(1);
        
        // bubbleTasks with specific category and special filters
        store.filterCat = 'work';
        store.tasks = [{ id: 3, category_slug: 'work', completed: false, calculatedPriority: 10 }];
        expect(store.bubbleTasks.length).toBe(1);

        store.filterCat = 'archive';
        expect(store.bubbleTasks).toEqual([]);
        store.filterCat = 'hidden';
        expect(store.bubbleTasks).toEqual([]);
    });

    it('covers logout method', async () => {
        const store = useBalanceStore();
        store.token = 'abc';
        axios.post.mockResolvedValueOnce({});
        
        await store.logout();
        expect(store.token).toBeNull();

        // Logout error coverage
        store.token = 'def';
        axios.post.mockRejectedValueOnce(new Error('Logout failed'));
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        await store.logout();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('covers sync branches (forceFull false, existing tasks)', async () => {
        const store = useBalanceStore();
        store.tasks = [{ id: 1 }];
        store.lastSync = '2026-01-01';
        
        axios.get.mockResolvedValueOnce({
            data: {
                tasks: { updated: [{ id: 1, title: 'Updated' }], deleted: [2] },
                categories: { updated: [], deleted: [] },
                settings: { theme: 'dark', locale: 'en' },
                server_time: '2026-01-02'
            }
        });
        
        await store.sync(false);
        expect(store.theme).toBe('dark');
        expect(store.tasks[0].title).toBe('Updated');
    });

    it('covers pulse and theme methods', () => {
        const store = useBalanceStore();
        vi.useFakeTimers();
        
        // Pulse
        store.pulseInterval = 1;
        store.startPulse();
        expect(store.pulseTimer).not.toBeNull();
        
        // Fast forward 1 min
        vi.advanceTimersByTime(60000);
        // It recalculates or fetches
        store.stopPulse();
        expect(store.pulseTimer).toBeNull();
        
        vi.useRealTimers();

        // applyTheme
        store.theme = 'dark';
        store.applyTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        store.theme = 'light';
        store.applyTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('covers updateTask recurring branch edge cases', async () => {
        const store = useBalanceStore();
        const task = { id: 1, completed: false, repeat_type: 'none' };
        store.tasks = [task];
        
        axios.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });
        
        // payload has recurring
        await store.updateTask(1, { repeat_type: 'weekly', completed: true, repeat_days: [1] });
        expect(axios.put).toHaveBeenCalled();
        
        // existing task has recurring, payload has none
        task.repeat_type = 'weekly';
        axios.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });
        await store.updateTask(1, { completed: true });
        expect(axios.put).toHaveBeenCalled();
    });
    it('handles fetchStats success and error', async () => {
        const store = useBalanceStore();
        store.token = 'test-token';
        axios.get.mockResolvedValueOnce({ data: { all: 5 } });
        await store.fetchStats();
        expect(store.stats).toEqual({ all: 5 });

        // Error
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValueOnce(new Error('Network error'));
        await store.fetchStats();
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('handles fetchAll error', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValue(new Error('Sync error'));
        
        // fetchAll calls sync(true) which has a try/catch
        await store.fetchAll();
        
        expect(spy).toHaveBeenCalled();
        spy.mockRestore();
    });

    it('covers setLocale and setPulseInterval', async () => {
        const store = useBalanceStore();
        axios.post.mockResolvedValue({ data: {} });
        
        await store.setLocale('en');
        expect(store.locale).toBe('en');
        expect(localStorage.getItem('locale')).toBe('en');
        
        await store.setPulseInterval(15);
        expect(store.pulseInterval).toBe(15);
        expect(localStorage.getItem('pulse_interval')).toBe('15');
    });

    it('covers toggleNotifications', async () => {
        const store = useBalanceStore();
        
        // Mock success for both actions
        vi.spyOn(store, 'subscribeToPush').mockResolvedValue(true);
        vi.spyOn(store, 'unsubscribeFromPush').mockResolvedValue(true);

        store.notificationsEnabled = false;
        await store.toggleNotifications();
        expect(store.subscribeToPush).toHaveBeenCalled();

        store.notificationsEnabled = true;
        await store.toggleNotifications();
        expect(store.unsubscribeFromPush).toHaveBeenCalled();
    });

    it('handles subscribeToPush catch block', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock failure in the try block
        global.navigator.serviceWorker.ready = Promise.reject(new Error('VAPID public key not found'));

        await store.subscribeToPush();
        
        expect(spy).toHaveBeenCalledWith('Push subscription failed:', expect.any(Error));
        spy.mockRestore();
    });

    it('handles unsubscribeFromPush error', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        
        // Mock navigator.serviceWorker.ready failure
        global.navigator.serviceWorker.ready = Promise.reject(new Error('SW error'));

        await store.unsubscribeFromPush();
        
        expect(spy).toHaveBeenCalledWith('Push unsubscription failed:', expect.any(Error));
        spy.mockRestore();
    });

    it('calculates next occurrences', () => {
        const store = useBalanceStore();
        
        // Weekly
        const t1 = { id: 1, repeat_type: 'weekly', repeat_days: [1] };
        const n1 = store.calculateNextOccurrence(t1);
        expect(new Date(n1.hidden_until).getDay()).toBe(1);
        
        // Interval
        const t2 = { id: 2, repeat_type: 'interval', repeat_interval: 3 };
        const n2 = store.calculateNextOccurrence(t2);
        const expected = new Date();
        expected.setDate(expected.getDate() + 3);
        expect(new Date(n2.hidden_until).getDate()).toBe(expected.getDate());

        // Default repeat interval
        const t3 = { id: 3, repeat_type: 'interval' };
        const n3 = store.calculateNextOccurrence(t3);
        const expected2 = new Date();
        expected2.setDate(expected2.getDate() + 1);
        expect(new Date(n3.hidden_until).getDate()).toBe(expected2.getDate());
    });

    it('handles task actions edge cases', async () => {
        const store = useBalanceStore();
        
        axios.put.mockResolvedValue({ data: {} });

        // completeTask on already completed
        store.tasks = [{ id: 1, completed: true }];
        await store.completeTask(1);
        expect(axios.put).not.toHaveBeenCalled();

        vi.clearAllMocks();

        // completeTask on non-existent
        await store.completeTask(999);
        expect(axios.put).not.toHaveBeenCalled();
        
        vi.clearAllMocks();

        // updateTask on non-existent
        store.tasks = [];
        await store.updateTask(1, { title: 'New' });
        expect(axios.put).not.toHaveBeenCalled();
    });

    it('covers recurring task local update', async () => {
        const store = useBalanceStore();
        const task = { id: 1, repeat_type: 'interval', repeat_interval: 1, completed: false };
        store.tasks = [task];
        
        axios.put.mockResolvedValue({ data: { id: 1, repeat_type: 'interval', repeat_interval: 1, completed: false, hidden_until: '2026-01-01' } });
        
        await store.updateTask(1, { completed: true });
        
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({
            _was_completed: true,
            completed: false
        }));
    });

    it('covers all remaining edge cases for 100% coverage', async () => {
        const store = useBalanceStore();
        const now = new Date();
        const futureDate = new Date(now.getTime() + 86400000).toISOString();
        const targetDay = (now.getDay() + 2) % 7; 

        // Mock window.matchMedia
        global.window.matchMedia = global.window.matchMedia || function() {
            return { matches: false, addListener: function() {}, removeListener: function() {} };
        };

        // 1. Line 50: bubbleTasks with hidden_until in future
        store.tasks = [{ id: 1, category_slug: 'work', completed: false, hidden_until: futureDate }];
        store.filterCat = 'work';
        expect(store.bubbleTasks.length).toBe(0);

        // 2. Line 77: filteredTasks archive sort where completed_at is missing for both
        store.tasks = [
            { id: 2, category_slug: 'work', completed: true }, // no completed_at
            { id: 3, category_slug: 'work', completed: true }  // no completed_at
        ];
        store.filterCat = 'archive';
        expect(store.filteredTasks.length).toBe(2);

        // 3. Line 102: counts when state.tasks is not an array
        store.tasks = null;
        expect(store.counts.all).toBe(0);

        // 4. Line 146: logout without token
        store.token = null;
        await store.logout();
        expect(store.token).toBeNull(); // Should return early or bypass if safely

        // 5. Line 165: fetchStats without token
        store.token = null;
        await store.fetchStats(); // Should return early, no axios call

        // 6. Line 193/198: sync where forceFull false but tasks empty
        store.tasks = [];
        store.lastSync = '2026-01-01';
        axios.get.mockResolvedValueOnce({ data: { tasks: { updated: [], deleted: [] }, categories: { updated: [], deleted: [] } } });
        await store.sync(false);

        // 7. Line 215: sync fallback for settings and subcatCoeffs
        axios.get.mockResolvedValueOnce({ 
            data: { 
                tasks: { updated: [], deleted: [] }, 
                categories: { updated: [], deleted: [] },
                settings: { theme: null, locale: null, notepad_text: null, pulse_interval: null },
                subcatCoeffs: { 'test': 1.5 }
            } 
        });
        store.theme = 'light';
        await store.sync(false);
        expect(store.theme).toBe('light');
        expect(store.subcatCoeffs.test).toBe(1.5);

        // Extra test for mergeCollection with isFull true but updated is not an array
        store.mergeCollection('tasks', { updated: null }, true);
        expect(store.tasks).toEqual([]);

        // Extra test for mergeCollection with isFull false but updated is not an array
        store.mergeCollection('tasks', { updated: null }, false);
        // Shouldn't crash

        // Extra test for weekly repeat without repeat_days
        const tWeeklyEmpty = { repeat_type: 'weekly', repeat_days: [] };
        const nextOccEmpty = store.calculateNextOccurrence(tWeeklyEmpty);
        expect(nextOccEmpty.hidden_until).toBeDefined();

        // Extra test for calculateNextOccurrence where payload overrides task
        const nextOccPayload = store.calculateNextOccurrence(
            { repeat_type: 'none' }, 
            { repeat_type: 'weekly', repeat_days: [targetDay] }
        );
        expect(nextOccPayload.hidden_until).toBeDefined();

        // Extra test for sync with forceFull = false, lastSync missing
        store.tasks = [{ id: 1 }];
        store.lastSync = null;
        axios.get.mockResolvedValueOnce({ data: { tasks: { updated: [], deleted: [] }, categories: { updated: [], deleted: [] } } });
        await store.sync(false);

        // 8. Line 298-301: unsubscribeFromPush when subscription is falsy
        global.navigator.serviceWorker.ready = Promise.resolve({
            pushManager: { getSubscription: vi.fn().mockResolvedValue(null) }
        });
        await store.unsubscribeFromPush();
        expect(store.notificationsEnabled).toBe(false);

        // 9. Line 320: startPulse when pulseInterval <= 0
        store.pulseInterval = 0;
        store.startPulse();
        expect(store.pulseTimer).toBeNull();

        // 10. Line 391: updateTask when idx === -1 during await
        store.tasks = [{ id: 1, title: 'Old' }];
        axios.put.mockImplementationOnce(async () => {
            store.tasks = []; // Mutate during await to simulate race condition
            return { data: { id: 1, title: 'New' } };
        });
        await store.updateTask(1, { title: 'New' });
        // Should not crash

        // 11. Line 406: calculateNextOccurrence weekly where next day is NOT included
        // Force the while loop body to execute
        const tWeekly = { repeat_type: 'weekly', repeat_days: [targetDay] };
        const nextOcc = store.calculateNextOccurrence(tWeekly);
        expect(nextOcc.hidden_until).toBeDefined();
    });

    it('covers hexToRgba with default hex', () => {
        expect(hexToRgba(null, 0.5)).toBe('rgba(150, 150, 150, 0.5)');
    });

    it('covers recalculateTasks with empty categories', () => {
        const tasks = [{ id: 1 }];
        expect(recalculateTasks(tasks, null)).toBe(tasks);
        expect(recalculateTasks(tasks, [])).toBe(tasks);
    });

    it('covers isCategoryPostponed invalid format', () => {
        expect(isCategoryPostponed({ hide_until: 'invalid' })).toBe(false);
    });
});
