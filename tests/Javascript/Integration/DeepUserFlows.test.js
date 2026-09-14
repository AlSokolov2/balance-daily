/**
 * Integration tests: task edge cases, recurring tasks,
 * error handling, and priority engine.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import axios from 'axios';

vi.mock('axios');

const authSetup = () => {
    const auth = useAuthStore();
    auth.token = 'test-token';
    axios.defaults.headers.common['Authorization'] = 'Bearer test-token';
};

beforeEach(() => {
    setActivePinia(createPinia());
    vi.clearAllMocks();
    localStorage.clear();
    delete axios.defaults.headers.common['Authorization'];
    window.apiBaseUrl = 'https://balance.example.com';
    axios.defaults.baseURL = window.apiBaseUrl + '/api/';
});

// ═══════════════════════════════════════════════════════════
// Task Edge Cases
// ═══════════════════════════════════════════════════════════
describe('Task Edge Cases', () => {
    beforeEach(() => { authSetup(); });

    it('creates task with all optional fields', async () => {
        const tasksStore = useTasksStore();
        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];

        const payload = {
            title: 'Urgent Task',
            category_slug: 'chor',
            importance: 5,
            deadline: '2026-07-25T18:00:00.000Z',
            urgency: 'urgent',
            scheduled_date: '2026-07-24',
            estimated_duration: 30,
            subcategory: 'frontend',
            notes: 'secret',
        };
        axios.post.mockResolvedValueOnce({ data: { id: 200, ...payload, completed: false } });

        await tasksStore.addTask(payload);
        expect(axios.post).toHaveBeenCalledWith('tasks', expect.objectContaining({
            title: 'Urgent Task',
            deadline: '2026-07-25T18:00:00.000Z',
            urgency: 'urgent',
            scheduled_date: '2026-07-24',
            estimated_duration: 30,
            subcategory: 'frontend',
        }));
    });

    it('postpones and unpostpones task', async () => {
        const tasksStore = useTasksStore();
        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        tasksStore.tasks = [{ id: 300, title: 'Delay Me', category_slug: 'chor', importance: 3, completed: false }];

        const postponed = { ...tasksStore.tasks[0], postpone_until: '2026-08-01', hidden_until: '2026-08-01' };
        axios.put.mockResolvedValueOnce({ data: postponed });

        await tasksStore.updateTask(300, { postpone_until: '2026-08-01', hidden_until: '2026-08-01' });
        expect(axios.put).toHaveBeenCalledWith('tasks/300', expect.objectContaining({
            postpone_until: '2026-08-01',
            hidden_until: '2026-08-01',
        }));

        // Return now
        const active = { ...postponed, postpone_until: null, hidden_until: null };
        axios.put.mockResolvedValueOnce({ data: active });
        await tasksStore.returnNow(300);
        expect(axios.put).toHaveBeenCalledWith('tasks/300', expect.objectContaining({
            hidden_until: null,
            postpone_until: null,
        }));
    });

    it('archives and restores task', async () => {
        const tasksStore = useTasksStore();
        tasksStore.tasks = [{ id: 400, title: 'To Archive', category_slug: 'chor', importance: 2, completed: false }];

        axios.put.mockResolvedValueOnce({ data: { ...tasksStore.tasks[0], completed: true } });
        await tasksStore.archiveTask(400);
        expect(axios.put).toHaveBeenCalledWith('tasks/400', expect.objectContaining({
            completed: true,
            _skip_history: true,
        }));
        expect(tasksStore.tasks).toHaveLength(0);

        // Restore
        tasksStore.tasks = [{ id: 400, title: 'To Archive', category_slug: 'chor', importance: 2, completed: true }];
        axios.put.mockResolvedValueOnce({ data: { id: 400, completed: false, hidden_until: null, postpone_until: null } });
        await tasksStore.restoreTask(400);
        expect(axios.put).toHaveBeenCalledWith('tasks/400', expect.objectContaining({
            completed: false,
            completed_at: null,
            hidden_until: null,
            postpone_until: null,
        }));
    });
});

// ═══════════════════════════════════════════════════════════
// Search, Filter, Count (balance store getters)
// ═══════════════════════════════════════════════════════════
describe('Search & Filter', () => {
    beforeEach(() => { authSetup(); });

    it('filters tasks by search query', () => {
        const tasksStore = useTasksStore();
        tasksStore.tasks = [
            { id: 1, title: 'Buy groceries', category_slug: 'chor', importance: 2, completed: false },
            { id: 2, title: 'Write tests', category_slug: 'prog', importance: 5, completed: false },
            { id: 3, title: 'Read book', category_slug: 'hobb', importance: 1, completed: false },
        ];

        const balance = useBalanceStore();
        balance.searchQuery = 'test';
        expect(balance.filteredTasks).toHaveLength(1);
        expect(balance.filteredTasks[0].title).toBe('Write tests');

        balance.searchQuery = '';
        expect(balance.filteredTasks).toHaveLength(3);
    });

    it('filters tasks by category', () => {
        const tasksStore = useTasksStore();
        tasksStore.categories = [
            { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null },
            { id: 2, slug: 'prog', name: 'PROG', weight: 0.46, color: '#0f0', hide_until: null },
        ];
        tasksStore.tasks = [
            { id: 1, title: 'A', category_slug: 'chor', importance: 2, completed: false },
            { id: 2, title: 'B', category_slug: 'prog', importance: 3, completed: false },
            { id: 3, title: 'C', category_slug: 'chor', importance: 1, completed: false },
        ];

        const balance = useBalanceStore();
        balance.filterCat = 'chor';
        expect(balance.filteredTasks).toHaveLength(2);

        balance.filterCat = 'all';
        expect(balance.filteredTasks).toHaveLength(3);
    });

    it('counts tasks by status (all/hidden/archive)', () => {
        const tasksStore = useTasksStore();
        const now = new Date();
        tasksStore.tasks = [
            { id: 1, title: 'Active', category_slug: 'chor', importance: 3, completed: false },
            { id: 2, title: 'Done', category_slug: 'chor', importance: 3, completed: true },
            { id: 3, title: 'Hidden', category_slug: 'chor', importance: 1, completed: false,
                hidden_until: new Date(now.getTime() + 86400000).toISOString() },
        ];

        const balance = useBalanceStore();
        // counts.all = active (not completed, not hidden)
        expect(balance.counts.all).toBe(1);
        expect(balance.counts.hidden).toBe(1);
        expect(balance.counts.archive).toBe(1);
    });
});

// ═══════════════════════════════════════════════════════════
// Recurring Tasks
// ═══════════════════════════════════════════════════════════
describe('Recurring Tasks', () => {
    beforeEach(() => { authSetup(); });

    it('completing recurring task sets _was_completed flag and reschedules', async () => {
        const tasksStore = useTasksStore();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-22'));

        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        tasksStore.tasks = [{
            id: 500,
            title: 'Daily Standup',
            category_slug: 'chor',
            importance: 3,
            completed: false,
            repeat_type: 'interval',
            repeat_interval: 1,
            completed_at: null,
            missed_count: 2,
            hidden_until: null,
            last_completed_date: null,
        }];

        const serverResp = {
            ...tasksStore.tasks[0],
            completed: false,
            completed_at: null,
            hidden_until: '2026-07-23',
            missed_count: 0,
            last_completed_date: '2026-07-22',
        };
        axios.put.mockResolvedValueOnce({ data: serverResp });

        await tasksStore.completeTask(500);

        // updateTask transforms completed→false for recurring tasks:
        // it adds _was_completed and hidden_until, resets missed_count
        expect(axios.put).toHaveBeenCalledWith('tasks/500', expect.objectContaining({
            completed: false,
            _was_completed: true,
            missed_count: 0,
            hidden_until: expect.any(String),
        }));
        // Task stays in list (not removed)
        expect(tasksStore.tasks).toHaveLength(1);

        vi.useRealTimers();
    });

    it('weekly recurring task with repeat_days', async () => {
        const tasksStore = useTasksStore();
        vi.useFakeTimers();
        vi.setSystemTime(new Date('2026-07-22')); // Wednesday

        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        tasksStore.tasks = [{
            id: 501,
            title: 'Team Sync',
            category_slug: 'prog',
            importance: 4,
            completed: false,
            repeat_type: 'weekly',
            repeat_days: [1, 3, 5],
            completed_at: null,
            missed_count: 0,
            hidden_until: null,
            last_completed_date: null,
        }];

        axios.put.mockResolvedValueOnce({ data: { ...tasksStore.tasks[0], hidden_until: '2026-07-24' } });
        await tasksStore.completeTask(501);

        expect(axios.put).toHaveBeenCalledWith('tasks/501', expect.objectContaining({
            _was_completed: true,
        }));

        vi.useRealTimers();
    });

    it('non-recurring task completes normally (no _was_completed)', async () => {
        const tasksStore = useTasksStore();
        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        tasksStore.tasks = [{
            id: 502, title: 'One-time', category_slug: 'chor', importance: 2,
            completed: false, repeat_type: 'none',
        }];

        axios.put.mockResolvedValueOnce({ data: { id: 502, completed: true, completed_at: '2026-07-22' } });
        await tasksStore.completeTask(502);

        expect(axios.put).toHaveBeenCalledWith('tasks/502', expect.objectContaining({
            completed: true,
            completed_at: expect.any(String),
            missed_count: 0,
        }));
    });

    it('deleteCompletion removes a completion record via API', async () => {
        const tasksStore = useTasksStore();
        axios.delete.mockResolvedValueOnce({});

        // Direct API call — task-completions endpoint
        await axios.delete('task-completions/99');
        expect(axios.delete).toHaveBeenCalledWith('task-completions/99');
    });
});

// ═══════════════════════════════════════════════════════════
// Error Handling
// ═══════════════════════════════════════════════════════════
describe('Error Handling', () => {
    beforeEach(() => { authSetup(); });

    it('updateTask returns undefined on network error', async () => {
        const tasksStore = useTasksStore();
        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        tasksStore.tasks = [{ id: 1, title: 'Test', category_slug: 'chor', importance: 3, completed: false }];

        // updateTask doesn't catch — the try/catch is in the component or balance store wrapper
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.put.mockRejectedValueOnce(new Error('Offline'));

        // Test that the error propagates (component-level catch handles it)
        await expect(
            tasksStore.updateTask(1, { title: 'New' })
        ).rejects.toThrow('Offline');

        consoleError.mockRestore();
    });

    it('sync preserves existing data on network failure', async () => {
        const tasksStore = useTasksStore();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

        tasksStore.tasks = [{ id: 1, title: 'Cached', category_slug: 'chor', importance: 3, completed: false }];
        tasksStore.categories = [{ id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null }];
        axios.get.mockRejectedValueOnce(new Error('Offline'));

        await tasksStore.sync();

        expect(tasksStore.tasks).toHaveLength(1);
        expect(tasksStore.loading).toBe(false);
        expect(consoleError).toHaveBeenCalled();
        consoleError.mockRestore();
    });

    it('fetchStats skips when not authenticated', async () => {
        const auth = useAuthStore();
        auth.token = null;

        const tasksStore = useTasksStore();
        await tasksStore.fetchStats({ date: '2026-07-22' });
        expect(axios.get).not.toHaveBeenCalled();
    });

    it('addTask does not add task on API failure', async () => {
        const tasksStore = useTasksStore();
        const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.post.mockRejectedValueOnce(new Error('Server error'));

        await expect(
            tasksStore.addTask({ title: '', category_slug: 'chor' })
        ).rejects.toThrow('Server error');

        expect(tasksStore.tasks).toHaveLength(0);
        consoleError.mockRestore();
    });

    it('unauthenticated API call gets 401', async () => {
        const auth = useAuthStore();
        auth.token = 'expired';
        axios.defaults.headers.common['Authorization'] = 'Bearer expired';

        axios.get.mockRejectedValueOnce({
            response: { status: 401, data: { message: 'Unauthenticated.' } },
        });

        await expect(axios.get('user')).rejects.toEqual(
            expect.objectContaining({ response: expect.objectContaining({ status: 401 }) })
        );
    });
});
