/**
 * Unit tests for tasks Pinia store.
 */
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import { useSettingsStore } from '../../../resources/js/stores/settings';
import axios from 'axios';

vi.mock('axios');

describe('Tasks Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    // ── State & Getters ──

    it('has correct default state', () => {
        const tasks = useTasksStore();
        expect(tasks.tasks).toEqual([]);
        expect(tasks.categories).toEqual([]);
        expect(tasks.subcatCoeffs).toEqual({});
        expect(tasks.notepadText).toBe('');
        expect(tasks.loading).toBe(false);
        expect(tasks.notificationsEnabled).toBe(false);
        expect(tasks.allTasksOrdered).toEqual([]);
        expect(tasks.allSubcats).toEqual([]);
        expect(tasks.counts.all).toBe(0);
    });

    it('allTasksOrdered sorts by priority descending', () => {
        const tasks = useTasksStore();
        tasks.tasks = [
            { id: 1, calculatedPriority: 5 },
            { id: 2, calculatedPriority: 15 },
            { id: 3, calculatedPriority: 10 },
        ];
        expect(tasks.allTasksOrdered.map(t => t.id)).toEqual([2, 3, 1]);
    });

    it('allTasksOrdered handles null/undefined', () => {
        const tasks = useTasksStore();
        tasks.tasks = null;
        expect(tasks.allTasksOrdered).toEqual([]);
    });

    it('allSubcats returns keys of subcatCoeffs', () => {
        const tasks = useTasksStore();
        tasks.subcatCoeffs = { foo: 1.0, bar: 0.5 };
        expect(tasks.allSubcats).toEqual(['foo', 'bar']);
    });

    it('counts correctly categorizes tasks', () => {
        const tasks = useTasksStore();
        const future = new Date(Date.now() + 86400000).toISOString();
        tasks.tasks = [
            { id: 1, completed: false, category_slug: 'work' },
            { id: 2, completed: true },
            { id: 3, completed: true },
            { id: 4, completed: false, hidden_until: future },
        ];
        expect(tasks.counts.all).toBe(1);
        expect(tasks.counts.archive).toBe(2);
        expect(tasks.counts.hidden).toBe(1);
        expect(tasks.counts.byCat.work).toBe(1);
    });

    it('counts handles null tasks', () => {
        const tasks = useTasksStore();
        tasks.tasks = null;
        expect(tasks.counts.all).toBe(0);
    });

    // ── Sync ──

    it('sync performs full load when no lastSync', async () => {
        const tasks = useTasksStore();
        axios.get.mockResolvedValueOnce({
            data: {
                tasks: { updated: [{ id: 1, title: 'Task' }], deleted: [] },
                categories: { updated: [], deleted: [] },
                server_time: '2026-01-01T00:00:00Z',
            },
        });

        await tasks.sync();

        expect(tasks.tasks).toHaveLength(1);
        expect(tasks.lastSync).toBe('2026-01-01T00:00:00Z');
        expect(tasks.loading).toBe(false);
    });

    it('sync performs delta load when lastSync exists', async () => {
        const tasks = useTasksStore();
        tasks.lastSync = '2026-01-01T00:00:00Z';
        tasks.tasks = [{ id: 1, title: 'Old' }];

        axios.get.mockResolvedValueOnce({
            data: {
                tasks: { updated: [{ id: 1, title: 'Updated' }, { id: 2, title: 'New' }], deleted: [3] },
                categories: { updated: [], deleted: [] },
                server_time: '2026-01-02T00:00:00Z',
            },
        });

        await tasks.sync(false);

        expect(tasks.tasks).toHaveLength(2);
        expect(tasks.tasks.find(t => t.id === 1).title).toBe('Updated');
        expect(tasks.lastSync).toBe('2026-01-02T00:00:00Z');
    });

    it('sync updates settings from server response', async () => {
        const tasks = useTasksStore();
        const settings = useSettingsStore();

        axios.get.mockResolvedValueOnce({
            data: {
                tasks: { updated: [], deleted: [] },
                categories: { updated: [], deleted: [] },
                settings: { theme: 'dark', locale: 'en', notepad_text: 'hello', pulse_interval: 5 },
                server_time: '2026-01-01T00:00:00Z',
            },
        });

        await tasks.sync();

        expect(settings.theme).toBe('dark');
        expect(settings.locale).toBe('en');
        expect(tasks.notepadText).toBe('hello');
        expect(settings.pulseInterval).toBe(5);
    });

    it('sync handles errors gracefully', async () => {
        const tasks = useTasksStore();
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.get.mockRejectedValueOnce(new Error('Network error'));

        await tasks.sync();

        expect(spy).toHaveBeenCalled();
        expect(tasks.loading).toBe(false);
        spy.mockRestore();
    });

    // ── mergeCollection ──

    it('mergeCollection replaces on full sync', () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 99 }];
        tasks.mergeCollection('tasks', { updated: [{ id: 1 }], deleted: [] }, true);
        expect(tasks.tasks).toEqual([{ id: 1 }]);
    });

    it('mergeCollection removes deleted items on delta', () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1 }, { id: 2 }, { id: 3 }];
        tasks.mergeCollection('tasks', { updated: [], deleted: [2] }, false);
        expect(tasks.tasks).toEqual([{ id: 1 }, { id: 3 }]);
    });

    it('mergeCollection handles null data', () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1 }];
        tasks.mergeCollection('tasks', null, false);
        expect(tasks.tasks).toEqual([{ id: 1 }]);
    });

    // ── Task CRUD ──

    it('addTask creates task and recalculates', async () => {
        const tasks = useTasksStore();
        axios.post.mockResolvedValueOnce({ data: { id: 1, title: 'New' } });

        await tasks.addTask({ title: 'New' });

        expect(tasks.tasks).toHaveLength(1);
        expect(tasks.tasks[0].title).toBe('New');
        expect(axios.post).toHaveBeenCalledWith('tasks', { title: 'New' });
    });

    it('deleteTask removes task and recalculates', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1 }, { id: 2 }];
        axios.delete.mockResolvedValueOnce({});

        await tasks.deleteTask(1);

        expect(tasks.tasks).toEqual([{ id: 2 }]);
        expect(axios.delete).toHaveBeenCalledWith('tasks/1');
    });

    it('updateTask sends correct payload', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, title: 'Old' }];
        axios.put.mockResolvedValueOnce({ data: { id: 1, title: 'Updated' } });

        await tasks.updateTask(1, { title: 'Updated' });

        expect(tasks.tasks[0].title).toBe('Updated');
        expect(axios.put).toHaveBeenCalledWith('tasks/1', { title: 'Updated' });
    });

    it('updateTask handles missing task gracefully', async () => {
        const tasks = useTasksStore();
        await tasks.updateTask(999, { title: 'Ghost' });
        expect(axios.put).not.toHaveBeenCalled();
    });

    it('completeTask delegates to updateTask', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, completed: false }];
        axios.put.mockResolvedValueOnce({ data: { id: 1, completed: true } });

        await tasks.completeTask(1);

        expect(axios.put).toHaveBeenCalled();
        const payload = axios.put.mock.calls[0][1];
        expect(payload.completed).toBe(true);
        expect(payload.completed_at).toBeDefined();
    });

    it('completeTask skips already completed', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, completed: true }];
        await tasks.completeTask(1);
        expect(axios.put).not.toHaveBeenCalled();
    });

    it('completeTask skips missing task', async () => {
        const tasks = useTasksStore();
        await tasks.completeTask(999);
        expect(axios.put).not.toHaveBeenCalled();
    });

    it('archiveTask marks completed and removes from local list', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1 }, { id: 2 }];
        axios.put.mockResolvedValueOnce({});

        await tasks.archiveTask(1);

        expect(tasks.tasks).toHaveLength(1);
        expect(axios.put).toHaveBeenCalledWith('tasks/1', expect.objectContaining({ completed: true, _skip_history: true }));
    });

    it('restoreTask delegates to updateTask', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, completed: true }];
        axios.put.mockResolvedValueOnce({ data: { id: 1, completed: false } });

        await tasks.restoreTask(1);

        const payload = axios.put.mock.calls[0][1];
        expect(payload.completed).toBe(false);
        expect(payload.hidden_until).toBeNull();
        expect(payload.postpone_until).toBeNull();
    });

    it('returnNow clears postpone and hidden', async () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, hidden_until: '2099-01-01' }];
        axios.put.mockResolvedValueOnce({ data: { id: 1, hidden_until: null } });

        await tasks.returnNow(1);

        const payload = axios.put.mock.calls[0][1];
        expect(payload.hidden_until).toBeNull();
        expect(payload.postpone_until).toBeNull();
    });

    // ── Pulse ──

    it('startPulse and stopPulse manage timer', () => {
        vi.useFakeTimers();
        const tasks = useTasksStore();
        useSettingsStore().pulseInterval = 1;

        tasks.startPulse();
        expect(tasks.pulseTimer).not.toBeNull();

        tasks.stopPulse();
        expect(tasks.pulseTimer).toBeNull();
    });

    it('startPulse skips when pulseInterval is 0', () => {
        const tasks = useTasksStore();
        useSettingsStore().pulseInterval = 0;

        tasks.startPulse();
        expect(tasks.pulseTimer).toBeNull();
    });

    it('recalculateAll updates tasks with priority engine', () => {
        const tasks = useTasksStore();
        tasks.tasks = [{ id: 1, category_slug: 'work', importance: 1, completed: false }];
        tasks.categories = [{ slug: 'work', weight: 1, color: '#ff0000' }];

        tasks.recalculateAll();

        expect(tasks.tasks[0].calculatedPriority).toBeDefined();
        expect(tasks.tasks[0].calculatedPriority).toBeGreaterThan(0);
    });

    it('checkReminders fires notification for matching time', () => {
        const tasks = useTasksStore();
        const now = new Date();
        const ct = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

        const notifySpy = vi.fn();
        global.Notification = notifySpy;
        global.Notification.permission = 'granted';

        tasks.tasks = [{ id: 1, title: 'Remind me', completed: false, reminder_times: [ct] }];
        tasks.checkReminders();

        expect(notifySpy).toHaveBeenCalledWith('Remind me', expect.objectContaining({ tag: `rem-1-${ct}` }));
    });

    // ── Priority helpers ──

    it('calculateNextOccurrence for interval type', () => {
        const tasks = useTasksStore();
        const t = { repeat_type: 'interval', repeat_interval: 3 };

        const result = tasks.calculateNextOccurrence(t);

        expect(result.hidden_until).toBeDefined();
        expect(result.last_completed_date).toBeDefined();
        const hiddenDate = new Date(result.hidden_until);
        const expected = new Date();
        expected.setDate(expected.getDate() + 3);
        expect(hiddenDate.getDate()).toBe(expected.getDate());
    });

    it('calculateNextOccurrence defaults to 1 day interval', () => {
        const tasks = useTasksStore();
        const t = { repeat_type: 'interval' };

        const result = tasks.calculateNextOccurrence(t);
        const hiddenDate = new Date(result.hidden_until);
        const expected = new Date();
        expected.setDate(expected.getDate() + 1);
        expect(hiddenDate.getDate()).toBe(expected.getDate());
    });

    it('isCategoryPostponed checks category hide_until', () => {
        const tasks = useTasksStore();
        tasks.categories = [{ slug: 'work', hide_until: '23:59' }];
        expect(tasks.isCategoryPostponed('work')).toBe(true);
    });

    it('isCategoryPostponed returns false for active category', () => {
        const tasks = useTasksStore();
        tasks.categories = [{ slug: 'work' }];
        expect(tasks.isCategoryPostponed('work')).toBe(false);
    });

    it('isEffectivelyPostponed checks task and category postpone', () => {
        const tasks = useTasksStore();
        tasks.categories = [{ slug: 'work' }];
        const t = { postpone_until: '2099-01-01', category_slug: 'work' };
        expect(tasks.isEffectivelyPostponed(t)).toBe(true);
    });

    it('isHidden checks hidden_until', () => {
        const tasks = useTasksStore();
        expect(tasks.isHidden({})).toBeFalsy();
        expect(tasks.isHidden({ hidden_until: '2099-01-01' })).toBe(true);
        expect(tasks.isHidden({ hidden_until: '2020-01-01' })).toBe(false);
    });

    // ── fetchStats ──

    it('fetchStats loads stats when authenticated', async () => {
        setActivePinia(createPinia());
        const { useAuthStore } = await import('../../../resources/js/stores/auth');
        const auth = useAuthStore();
        auth.token = 'test-token';

        const tasks = useTasksStore();
        axios.get.mockResolvedValueOnce({ data: { all: 5 } });

        await tasks.fetchStats();

        expect(tasks.stats).toEqual({ all: 5 });
    });

    it('fetchStats skips when no token', async () => {
        const tasks = useTasksStore();
        await tasks.fetchStats();
        expect(axios.get).not.toHaveBeenCalled();
    });
});
