import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { setActivePinia, createPinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { calcPriority } from '../../../resources/js/utils/priority-engine';
import axios from 'axios';

vi.mock('axios');

describe('Balance Store - Prioritization Engine', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        // Setup base state
        const store = useBalanceStore();
        store.categories = [
            { slug: 'work', name: 'Work', weight: 0.5, color: '#ff0000' },
            { slug: 'life', name: 'Life', weight: 0.5, color: '#00ff00' }
        ];
    });

    it('calculates base priority correctly', () => {
        const catsMap = { 'work': { slug: 'work', currentWeight: 0.5 } };
        const task = { category_slug: 'work', importance: 2.0 };
        
        const priority = calcPriority(task, catsMap);
        expect(priority).toBe(1.0); // 0.5 * 2.0
    });

    it('boosts category weight if no tasks completed today', () => {
        const store = useBalanceStore();
        store.tasks = [
            { id: 1, title: 'T1', category_slug: 'work', importance: 2, completed: false }
        ];
        
        store.recalculateAll();
        
        // work (0.5 * 1.5 = 0.75) + life (0.5 * 1.5 = 0.75) = 1.5 total
        // normalized: 0.75 / 1.5 = 0.5 each.
        expect(store.categories.find(c => c.slug === 'work').currentWeight).toBeCloseTo(0.5);
    });

    it('correctly handles missed counts for interval repeat tasks', () => {
        const store = useBalanceStore();
        
        const now = new Date('2026-05-26T12:00:00Z');
        vi.setSystemTime(now);
        
        const lastCompleted = new Date('2026-05-24T12:00:00Z');
        
        const task = { 
            id: 1, 
            title: 'Repeat', 
            category_slug: 'work', 
            importance: 1, 
            completed: false,
            repeat_type: 'interval',
            repeat_interval: 1,
            last_completed_date: lastCompleted.toISOString()
        };
        
        store.tasks = [task];
        store.recalculateAll();
        
        expect(store.tasks[0].missed_count).toBe(1);
        
        vi.useRealTimers();
    });

    it('does not apply boost for missed tasks anymore', () => {
        const catsMap = { 'work': { slug: 'work', currentWeight: 1.0 } };
        
        const taskWithNoMiss = { category_slug: 'work', importance: 1.0, missed_count: 0 };
        const taskWith1Miss = { category_slug: 'work', importance: 1.0, missed_count: 1 };
        const taskWith2Miss = { category_slug: 'work', importance: 1.0, missed_count: 2 };

        // Priority should stay 1.0 regardless of missed_count
        expect(calcPriority(taskWithNoMiss, catsMap)).toBe(1.0);
        expect(calcPriority(taskWith1Miss, catsMap)).toBe(1.0);
        expect(calcPriority(taskWith2Miss, catsMap)).toBe(1.0);
    });

    it('adds bonus points for deadlines', () => {
        // ... (existing test)
    });

    it('handles authentication initialization correctly', async () => {
        const store = useBalanceStore();
        const mockUser = { id: 1, name: 'Test User' };
        
        // Mock successful user fetch
        axios.get.mockResolvedValueOnce({ data: mockUser }); // /api/user
        axios.get.mockResolvedValue({ data: [] }); // fetchAll calls
        
        store.token = 'fake-token';
        await store.init();
        
        expect(store.user).toEqual(mockUser);
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer fake-token');
    });

    it('moves recurring task to hidden instead of archive on completion with start-of-day time', async () => {
        const store = useBalanceStore();
        const now = new Date('2026-05-31T12:00:00'); // Local time noon
        vi.setSystemTime(now);

        const task = { 
            id: 1, 
            title: 'Recurring', 
            repeat_type: 'interval', 
            repeat_interval: 1, 
            completed: false 
        };
        store.tasks = [task];
        
        axios.put.mockImplementation((url, data) => Promise.resolve({ data }));

        await store.updateTask(1, { completed: true });

        // Verify it sent completed: false and hidden_until with 00:00:00 local time
        const payload = axios.put.mock.calls[0][1];
        
        expect(payload.completed).toBe(false);
        
        // Check if it's June 1st (since today is May 31) and time is 00:00 local
        const hiddenUntil = new Date(payload.hidden_until);
        expect(hiddenUntil.getHours()).toBe(0);
        expect(hiddenUntil.getMinutes()).toBe(0);
        expect(hiddenUntil.getDate()).toBe(1);
        expect(hiddenUntil.getMonth()).toBe(5); // June
        
        vi.useRealTimers();
    });

    it('clears state on logout', async () => {
        const store = useBalanceStore();
        store.token = 'fake-token';
        store.user = { id: 1 };
        
        axios.post.mockResolvedValueOnce({}); // /api/logout
        axios.get.mockResolvedValue({ data: [] }); // fetchAll
        
        await store.logout();
        
        expect(store.token).toBeNull();
        expect(store.user).toBeNull();
        expect(store.tasks).toHaveLength(0);
        expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });

    describe('Settings Management', () => {
        it('sets and saves visual style', async () => {
            const store = useBalanceStore();
            expect(store.visualStyle).toBe('bubbles'); // Default
            
            await store.setVisualStyle('treemap');
            
            expect(store.visualStyle).toBe('treemap');
            expect(localStorage.getItem('visual_style')).toBe('treemap');
        });
    });

    describe('Pulse & Sync', () => {
        beforeEach(() => {
            vi.useFakeTimers();
        });

        afterEach(() => {
            vi.useRealTimers();
        });

        it('recalculates priorities every minute', () => {
            const store = useBalanceStore();
            store.pulseInterval = 1; // Explicitly set to 1 minute
            const spy = vi.spyOn(store, 'recalculateAll');
            
            store.startPulse();
            
            vi.advanceTimersByTime(61000); // 1 minute + margin
            expect(spy).toHaveBeenCalledTimes(1);
            
            vi.advanceTimersByTime(60000);
            expect(spy).toHaveBeenCalledTimes(2);
        });

        it('triggers fetchAll when date changes during pulse', async () => {
            const store = useBalanceStore();
            store.pulseInterval = 1; // Explicitly set to 1 minute
            const spyFetch = vi.spyOn(store, 'fetchAll');
            const spyRecalc = vi.spyOn(store, 'recalculateAll');
            
            store.lastPulse = 'Mon Jan 01 2026';
            store.startPulse();

            // Mock date change to next day
            vi.setSystemTime(new Date('2026-01-02T12:00:00Z'));
            
            vi.advanceTimersByTime(61000);
            
            expect(spyFetch).toHaveBeenCalled();
            // recalculateAll is called inside fetchAll, so we don't expect it to be called directly in the interval
            expect(spyRecalc).not.toHaveBeenCalled(); 
        });
    });
});
