import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

describe('Balance Store - Perfectionist Coverage', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('setTheme updates state and calls API', async () => {
        const store = useBalanceStore();
        await store.setTheme('dark');
        expect(store.theme).toBe('dark');
        expect(axios.post).toHaveBeenCalledWith('settings', { settings: { theme: 'dark' } });
    });

    it('setLocale updates state and localStorage', async () => {
        const store = useBalanceStore();
        await store.setLocale('en');
        expect(store.locale).toBe('en');
        expect(localStorage.getItem('locale')).toBe('en');
    });

    it('setPulseInterval updates interval and restarts pulse', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(store, 'startPulse');
        await store.setPulseInterval(15);
        expect(store.pulseInterval).toBe(15);
        expect(spy).toHaveBeenCalled();
    });

    it('mergeCollection handles full and partial updates', () => {
        const store = useBalanceStore();
        
        // Full update
        store.mergeCollection('tasks', { updated: [{ id: 1, title: 'T1' }] }, true);
        expect(store.tasks).toHaveLength(1);

        // Partial update
        store.mergeCollection('tasks', { updated: [{ id: 1, title: 'T1-Updated' }, { id: 2, title: 'T2' }] }, false);
        expect(store.tasks).toHaveLength(2);
        expect(store.tasks.find(t => t.id === 1).title).toBe('T1-Updated');

        // Deletion
        store.mergeCollection('tasks', { deleted: [1] }, false);
        expect(store.tasks).toHaveLength(1);
        expect(store.tasks[0].id).toBe(2);
    });

    it('logout clears all state and storage', async () => {
        const store = useBalanceStore();
        store.token = 'test-token';
        store.user = { id: 1 };
        localStorage.setItem('auth_token', 'test-token');
        
        await store.logout();
        
        expect(store.token).toBeNull();
        expect(store.user).toBeNull();
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(store.tasks).toHaveLength(0);
    });

    it('calculateNextOccurrence handles interval and weekly types', () => {
        const store = useBalanceStore();
        const task = { repeat_type: 'interval', repeat_interval: 2 };
        
        // Interval
        const res1 = store.calculateNextOccurrence(task);
        expect(res1.hidden_until).toBeDefined();

        // Weekly
        const weeklyTask = { repeat_type: 'weekly', repeat_days: [1, 3] }; // Mon, Wed
        const res2 = store.calculateNextOccurrence(weeklyTask);
        expect(res2.hidden_until).toBeDefined();
    });

    it('isHidden correctly checks date', () => {
        const store = useBalanceStore();
        const future = new Date();
        future.setDate(future.getDate() + 1);
        expect(store.isHidden({ hidden_until: future.toISOString() })).toBe(true);
        
        const past = new Date();
        past.setDate(past.getDate() - 1);
        expect(store.isHidden({ hidden_until: past.toISOString() })).toBe(false);
    });
});
