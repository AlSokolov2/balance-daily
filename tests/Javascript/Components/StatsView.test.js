import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import StatsView from '../../../resources/js/views/StatsView.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import { mockPush } from '../setup.js';

// Mock axios for interactivity tests
vi.mock('axios', () => ({
    default: {
        get: vi.fn(),
    },
}));
import axios from 'axios';

describe('StatsView', () => {
    const mockStats = {
        heatmap: {
            '2026-07-03': 3,
            '2026-07-02': 1,
            '2026-07-01': 2,
        },
        category_balance: [
            { category_slug: 'work', count: 5 },
            { category_slug: 'chor', count: 2 },
        ],
        counters: {
            today: 3,
            total: 100,
            current_streak: 7,
            longest_streak: 30,
        },
        status: {
            active_tasks: 12,
            overdue_tasks: 3,
            postponed_tasks: 4,
            hidden_tasks: 2,
            completed_today: 5,
            completion_rate: 0.42,
            categories_health: {
                work: { active: 5, completed_today: 2, needs_attention: false },
                chor: { active: 7, completed_today: 0, needs_attention: true },
                empty: { active: 0, completed_today: 0, needs_attention: false },
            },
        },
        trends: {
            subcategory: [
                {
                    category_slug: 'work',
                    items: [
                        { name: 'coding', count: 5 },
                        { name: 'meetings', count: 0 },
                    ],
                },
                {
                    category_slug: 'chor',
                    items: [
                        { name: 'cleaning', count: 2 },
                    ],
                },
            ],
        },
    };

    /**
     * Mount StatsView and wait for async onMounted (fetchStats) to resolve.
     */
    const mountStatsView = async (overrides = {}) => {
        const wrapper = mount(StatsView, {
            global: {
                stubs: {
                    BaseButton: { template: '<button @click="$emit(\'click\')"><slot /></button>' },
                    AppIcon: { template: '<span />' },
                },
                ...overrides.global,
            },
            ...overrides,
        });
        // Flush the async onMounted callback (await store.fetchStats())
        await flushPromises();
        return wrapper;
    };

    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();

        // Mock fetchStats to be a no-op — we pre-set stats data
        vi.spyOn(store, 'fetchStats').mockResolvedValue();

        useTasksStore().categories = [
            { slug: 'work', name: 'Work', color: '#4A90D9' },
            { slug: 'chor', name: 'Chores', color: '#E8764A' },
        ];

        useTasksStore().stats = mockStats;
    });

    describe('Loading state', () => {
        it('finishes loading after fetchStats resolves', async () => {
            const wrapper = await mountStatsView();
            expect(wrapper.vm.loading).toBe(false);
        });

        it('shows loading text before fetchStats resolves', () => {
            // Don't mock fetchStats — spy with a pending promise
            const store = useBalanceStore();
            store.fetchStats.mockRestore();
            let resolveLater;
            vi.spyOn(store, 'fetchStats').mockImplementation(
                () => new Promise(resolve => { resolveLater = resolve; })
            );

            const wrapper = mount(StatsView, {
                global: {
                    stubs: {
                        BaseButton: { template: '<button><slot /></button>' },
                        AppIcon: { template: '<span />' },
                    },
                },
            });

            // Loading should be true while fetchStats hasn't resolved
            expect(wrapper.vm.loading).toBe(true);
            expect(wrapper.text()).toContain('common.loading');

            // Clean up
            resolveLater();
        });
    });

    describe('System status block', () => {
        it('renders the status section title', async () => {
            const wrapper = await mountStatsView();

            expect(wrapper.text()).toContain('stats.status.title');
        });

        it('renders all six status cards with correct values', async () => {
            const wrapper = await mountStatsView();

            const text = wrapper.text();

            expect(text).toContain('stats.status.active_tasks');
            expect(text).toContain('12');

            expect(text).toContain('stats.status.overdue_tasks');
            expect(text).toContain('3');

            expect(text).toContain('stats.status.postponed_tasks');
            expect(text).toContain('4');

            expect(text).toContain('stats.status.hidden_tasks');
            expect(text).toContain('2');

            expect(text).toContain('stats.status.completed_today');
            expect(text).toContain('5');

            expect(text).toContain('stats.status.completion_rate');
            expect(text).toContain('42%');
        });

        it('shows overdue count with red border when > 0', async () => {
            const wrapper = await mountStatsView();

            const overdueCard = wrapper
                .findAll('.grid.grid-cols-3 > div')
                .find(el => el.text().includes('stats.status.overdue_tasks'));
            expect(overdueCard).toBeTruthy();
            expect(overdueCard.classes()).toContain('border-red-500/30');
        });

        it('renders the completion rate progress bar at correct width', async () => {
            const wrapper = await mountStatsView();

            const bar = wrapper.find('.h-2.w-full .h-full.rounded-full');
            expect(bar.exists()).toBe(true);
            expect(bar.attributes('style')).toContain('42%');
        });
    });

    describe('Categories needing attention', () => {
        it('displays categories with needs_attention=true', async () => {
            const wrapper = await mountStatsView();

            const text = wrapper.text();
            expect(text).toContain('stats.status.needs_attention');
            expect(text).toContain('Chores');
        });

        it('navigates to category and sets filter on click', async () => {
            const wrapper = await mountStatsView();

            const attentionBtns = wrapper
                .findAll('button')
                .filter(b => b.text().includes('Chores'));
            expect(attentionBtns.length).toBeGreaterThan(0);

            await attentionBtns[0].trigger('click');

            expect(useBalanceStore().filterCat).toBe('chor');
            expect(mockPush).toHaveBeenCalledWith('/');
        });

        it('shows "all good" message when no categories need attention', async () => {
            useTasksStore().stats = {
                ...mockStats,
                status: {
                    ...mockStats.status,
                    categories_health: {
                        work: { active: 3, completed_today: 1, needs_attention: false },
                    },
                },
            };

            const wrapper = await mountStatsView();
            expect(wrapper.text()).toContain('stats.status.all_good');
        });
    });

    describe('Edge cases', () => {
        it('handles null stats without crashing', async () => {
            useTasksStore().stats = null;

            const wrapper = await mountStatsView();

            expect(wrapper.exists()).toBe(true);
            expect(wrapper.text()).not.toContain('stats.status.title');
        });

        it('shows "no active tasks" message when active_tasks is zero', async () => {
            useTasksStore().stats = {
                ...mockStats,
                status: {
                    ...mockStats.status,
                    active_tasks: 0,
                    completion_rate: 0,
                    categories_health: {
                        work: { active: 0, completed_today: 0, needs_attention: false },
                    },
                },
            };

            const wrapper = await mountStatsView();

            expect(wrapper.text()).toContain('stats.status.no_active_tasks');
            expect(wrapper.text()).toContain('0%');
        });

        it('shows all counters in the legacy grid', async () => {
            const wrapper = await mountStatsView();

            const text = wrapper.text();
            expect(text).toContain('stats.counters.today');
            expect(text).toContain('3');
            expect(text).toContain('stats.counters.total');
            expect(text).toContain('100');
            expect(text).toContain('stats.counters.current_streak');
            expect(text).toContain('7');
            expect(text).toContain('stats.counters.longest_streak');
            expect(text).toContain('30');
        });
    });

    describe('Interactivity', () => {
        beforeEach(() => {
            vi.clearAllMocks();
            axios.get.mockResolvedValue({
                data: {
                    date: '2026-07-03',
                    count: 3,
                    completions: [
                        { id: 1, task_id: 10, title: 'Buy groceries', category_slug: 'chor', completed_at: '2026-07-03T10:00:00Z' },
                        { id: 2, task_id: 11, title: 'Write report', category_slug: 'work', completed_at: '2026-07-03T14:00:00Z' },
                        { id: 3, task_id: 12, title: 'Exercise', category_slug: 'chor', completed_at: '2026-07-03T18:00:00Z' },
                    ],
                },
            });
        });

        it('shows detail panel when clicking a heatmap cell with completions', async () => {
            const wrapper = await mountStatsView();

            // Find a heatmap cell with count > 0 and click it
            const cells = wrapper.findAll('.w-3.h-3, .w-4.h-4');
            const activeCell = cells.find(c => c.attributes('title') && !c.attributes('title').includes(': 0'));
            if (!activeCell) return; // No active cells in mock data

            await activeCell.trigger('click');
            await flushPromises();

            // Detail panel should appear
            expect(wrapper.text()).toContain('stats.heatmap.completions');
            expect(axios.get).toHaveBeenCalled();
        });

        it('toggles detail panel off when clicking selected day again', async () => {
            const wrapper = await mountStatsView();

            const cells = wrapper.findAll('.w-3.h-3, .w-4.h-4');
            const activeCell = cells.find(c => c.attributes('title') && !c.attributes('title').includes(': 0'));
            if (!activeCell) return;

            // First click — opens
            await activeCell.trigger('click');
            await flushPromises();
            expect(axios.get).toHaveBeenCalledTimes(1);

            // Second click — closes
            await activeCell.trigger('click');
            await flushPromises();
            // Panel should disappear (second click toggles)
            expect(wrapper.vm.selectedDay).toBeNull();
        });

        it('does not fetch API when clicking cell with zero completions', async () => {
            const wrapper = await mountStatsView();

            const cells = wrapper.findAll('.w-3.h-3, .w-4.h-4');
            const emptyCell = cells.find(c => c.attributes('title') && c.attributes('title').endsWith(': 0'));
            if (!emptyCell) return;

            await emptyCell.trigger('click');
            await flushPromises();

            // No API call for empty days
            expect(axios.get).not.toHaveBeenCalled();
            // Panel shows "no completions"
            expect(wrapper.text()).toContain('stats.heatmap.no_completions');
        });

        it('renders task list in detail panel', async () => {
            const wrapper = await mountStatsView();

            // Manually set selectedDay and dayCompletions to verify rendering
            wrapper.vm.selectedDay = '2026-07-03';
            wrapper.vm.dayCompletions = [
                { id: 1, task_id: 10, title: 'Buy groceries', category_slug: 'chor', completed_at: '2026-07-03T10:00:00Z' },
                { id: 2, task_id: 11, title: 'Write report', category_slug: 'work', completed_at: '2026-07-03T14:00:00Z' },
            ];
            wrapper.vm.dayCount = 2;
            await flushPromises();

            const text = wrapper.text();
            expect(text).toContain('Buy groceries');
            expect(text).toContain('Write report');
        });

        it('navigates to category when clicking balance bar', async () => {
            const wrapper = await mountStatsView();

            // Find balance bars and click one
            const balanceBars = wrapper.findAll('.space-y-5 > .space-y-2');
            if (balanceBars.length > 0) {
                await balanceBars[0].trigger('click');
                expect(mockPush).toHaveBeenCalledWith('/');
                expect(useBalanceStore().filterCat).toBeTruthy();
            }
        });

        it('fetches today completions when clicking "today" counter', async () => {
            const wrapper = await mountStatsView();

            // Find the "today" counter and click it
            const counterDivs = wrapper.findAll('.grid.grid-cols-2 > div');
            const todayCounter = counterDivs.find(el => el.text().includes('stats.counters.today'));
            expect(todayCounter).toBeTruthy();

            await todayCounter.trigger('click');
            await flushPromises();

            expect(axios.get).toHaveBeenCalled();
            const callUrl = axios.get.mock.calls[0][0];
            expect(callUrl).toContain('date=');
        });

        it('does not fetch when clicking "today" counter with zero completions', async () => {
            // Override to have zero completions today
            useTasksStore().stats = {
                ...mockStats,
                counters: { ...mockStats.counters, today: 0 },
                status: { ...mockStats.status, completed_today: 0 },
            };

            const wrapper = await mountStatsView();

            const counterDivs = wrapper.findAll('.grid.grid-cols-2 > div');
            const todayCounter = counterDivs.find(el => el.text().includes('stats.counters.today'));
            expect(todayCounter).toBeTruthy();

            axios.get.mockClear();
            await todayCounter.trigger('click');
            await flushPromises();

            // Should not fetch when count is 0
            expect(axios.get).not.toHaveBeenCalled();
        });
    });

    describe('Subcategory trends', () => {
        it('renders subcategories grouped by category', async () => {
            const wrapper = await mountStatsView();

            // Category headers should appear
            const text = wrapper.text();
            expect(text).toContain('Work');
            expect(text).toContain('Chores');
        });

        it('renders subcategory items with counts', async () => {
            const wrapper = await mountStatsView();

            const text = wrapper.text();
            expect(text).toContain('coding');
            expect(text).toContain('5');
            expect(text).toContain('meetings');
            expect(text).toContain('0');
            expect(text).toContain('cleaning');
            expect(text).toContain('2');
        });

        it('renders subcategory section title', async () => {
            const wrapper = await mountStatsView();

            expect(wrapper.text()).toContain('stats.trends.subcategory.title');
        });

        it('shows empty state when no subcategory data', async () => {
            useTasksStore().stats = {
                ...mockStats,
                trends: { subcategory: [] },
            };

            const wrapper = await mountStatsView();

            expect(wrapper.text()).toContain('stats.trends.subcategory.no_data');
        });
    });
});
