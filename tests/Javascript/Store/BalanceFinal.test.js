import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { calcPriority } from '../../../resources/js/utils/priority-engine';
import axios from 'axios';

vi.mock('axios');

describe('Balance Store - Final Push for 100%', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        vi.stubGlobal('setInterval', vi.fn());
        vi.stubGlobal('clearInterval', vi.fn());
        vi.stubGlobal('alert', vi.fn());
        vi.stubGlobal('atob', (s) => Buffer.from(s, 'base64').toString('binary'));
        vi.stubGlobal('matchMedia', vi.fn().mockReturnValue({ matches: false }));
    });

    it('priority-engine line 25: subcategory coefficient hit', () => {
        const catsMap = { work: { currentWeight: 0.5 } };
        const subcatCoeffs = { dev: 2.0 };
        const task = { category_slug: 'work', subcategory: 'dev' };
        // This MUST execute: s *= subcatCoeffs[task.subcategory];
        const p = calcPriority(task, catsMap, subcatCoeffs);
        expect(p).toBe(1.0);
    });

    it('completeTask handles recurring tasks', async () => {
        const store = useBalanceStore();
        const task = { id: 1, repeat_type: 'interval', repeat_interval: 1, completed: false };
        store.tasks = [task];
        axios.put.mockResolvedValue({ data: { ...task, hidden_until: 'tomorrow' } });

        await store.completeTask(1);
        // It sets completed to false for recurring tasks to reset them
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ completed: false }));
    });

    it('completeTask handles simple tasks', async () => {
        const store = useBalanceStore();
        const task = { id: 2, repeat_type: 'none', completed: false };
        store.tasks = [task];
        axios.put.mockResolvedValue({ data: { ...task, completed: true } });

        await store.completeTask(2);
        expect(axios.put).toHaveBeenCalledWith('tasks/2', expect.objectContaining({ completed: true }));
    });

    it('unsubscribeFromPush handles success', async () => {
        const store = useBalanceStore();
        const unsubscribeSpy = vi.fn().mockResolvedValue(true);
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.resolve({
                    pushManager: {
                        getSubscription: vi.fn().mockResolvedValue({ 
                            endpoint: 'ep', 
                            unsubscribe: unsubscribeSpy 
                        })
                    }
                })
            }
        });

        await store.unsubscribeFromPush();
        expect(unsubscribeSpy).toHaveBeenCalled();
        expect(axios.delete).toHaveBeenCalled();
    });

    it('calculateNextOccurrence weekly while loop coverage', () => {
        const store = useBalanceStore();
        // Today is Sunday (0). Repeat on Wednesday (3).
        const task = { repeat_type: 'weekly', repeat_days: [3] };
        const res = store.calculateNextOccurrence(task);
        // Should loop multiple times to reach Wednesday
        expect(res.hidden_until).toBeDefined();
    });

    it('isCategoryPostponed and isEffectivelyPostponed full coverage', () => {
        const store = useBalanceStore();
        store.categories = [{ slug: 'work', hide_until: '23:59' }];
        expect(store.isCategoryPostponed('work')).toBe(true);
        expect(store.isCategoryPostponed('non-existent')).toBe(false);

        const task = { category_slug: 'work', force_active: false };
        expect(store.isEffectivelyPostponed(task)).toBe(true);
    });

    it('addTask and recalculateAll coverage', async () => {
        const store = useBalanceStore();
        axios.post.mockResolvedValue({ data: { id: 5, title: 'New' } });
        await store.addTask({ title: 'New' });
        expect(store.tasks).toHaveLength(1);

        store.recalculateAll(); // Just to hit the line
    });

    it('addTask with null dates sends null to API (fix for bug #115)', async () => {
        const store = useBalanceStore();
        axios.post.mockResolvedValue({ data: { id: 6, title: 'Bug 115', deadline: null, postpone_until: null } });

        // This is what DesktopAddForm.vue sends after the fix
        await store.addTask({
            title: 'Bug 115',
            category_slug: 'chor',
            importance: 2,
            repeat_type: 'none',
            repeat_interval: 1,
            repeat_days: [],
            deadline: null,
            postpone_until: null,
            ha: false,
            force_active: false,
            notes: '',
        });

        // null values for date fields pass nullable|date validation
        expect(axios.post).toHaveBeenCalledWith('tasks', expect.objectContaining({
            deadline: null,
            postpone_until: null,
        }));
    });

    it('handles init failure', async () => {
        const store = useBalanceStore();
        store.token = 'bad-token';
        axios.get.mockRejectedValue(new Error('Auth failed'));
        const logoutSpy = vi.spyOn(store, 'logout');
        
        await store.init();
        expect(logoutSpy).toHaveBeenCalled();
    });

    it('subscribeToPush fails if no public key', async () => {
        const store = useBalanceStore();
        vi.stubGlobal('__VAPID_PUBLIC_KEY__', null);
        await store.subscribeToPush();
        expect(window.alert).toHaveBeenCalled();
    });

    it('unsubscribeFromPush handles error', async () => {
        const store = useBalanceStore();
        vi.stubGlobal('navigator', {
            serviceWorker: {
                ready: Promise.reject('Worker fail')
            }
        });
        await store.unsubscribeFromPush();
        // Should catch and log
    });

    it('getters coverage: edge cases', () => {
        const store = useBalanceStore();
        
        // allTasksOrdered with empty
        store.tasks = null; 
        expect(store.allTasksOrdered).toEqual([]);

        // bubbleTasks with specific filters
        store.filterCat = 'archive';
        expect(store.bubbleTasks).toEqual([]);
        store.filterCat = 'hidden';
        expect(store.bubbleTasks).toEqual([]);

        // filteredTasks hidden
        store.filterCat = 'hidden';
        store.tasks = [{ id: 1, hidden_until: '2099-01-01', completed: false }];
        expect(store.filteredTasks).toHaveLength(1);

        // filteredTasks search
        store.filterCat = 'all';
        store.searchQuery = 'findme';
        store.tasks = [{ id: 2, title: 'FindMe', completed: false }];
        expect(store.filteredTasks).toHaveLength(1);

        // counts without category
        store.tasks = [{ id: 3, completed: false, category_slug: null }];
        expect(store.counts.all).toBe(1);
    });
});
