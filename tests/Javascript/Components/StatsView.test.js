import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount, flushPromises } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import StatsView from '../../../resources/js/views/StatsView.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import { mockPush } from '../setup.js';

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
});
