import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TreemapChart from '../../../resources/js/components/TreemapChart.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { mockPush } from '../setup';

describe('TreemapChart Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // Global mock for dimensions
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 });
    });

    it('renders and shows "Нет задач" when empty', () => {
        const wrapper = mount(TreemapChart, {
            props: { tasks: [] }
        });
        expect(wrapper.text()).toContain('app.no_tasks');
    });

    it('calculates squarified rects for tasks', async () => {
        const tasks = [
            { id: 1, title: 'Task 1', calculatedPriority: 10, category_slug: 'work' },
            { id: 2, title: 'Task 2', calculatedPriority: 10, category_slug: 'life' },
            { id: 3, title: 'Task 3', calculatedPriority: 5, category_slug: 'work' },
            { id: 4, title: 'Task 4', calculatedPriority: 5, category_slug: 'life' }
        ];
        
        const wrapper = mount(TreemapChart, {
            props: { tasks }
        });

        // Trigger resize/dimension update
        await wrapper.vm.$nextTick();
        
        const rects = wrapper.vm.treemapRects;
        expect(rects.length).toBe(4);
        
        // Total area should be roughly container area (minus some padding/rounding)
        const totalArea = rects.reduce((sum, r) => sum + (r.w + 4) * (r.h + 4), 0);
        expect(totalArea).toBeCloseTo(800 * 600, -2);

        // Verify that rects don't overlap significantly and stay within bounds
        rects.forEach(r => {
            expect(r.x).toBeGreaterThanOrEqual(0);
            expect(r.y).toBeGreaterThanOrEqual(0);
            expect(r.x + r.w).toBeLessThanOrEqual(800);
            expect(r.y + r.h).toBeLessThanOrEqual(600);
        });
    });

    it('navigates to edit screen when a block is clicked', async () => {
        const tasks = [{ id: 1, title: 'Task 1', calculatedPriority: 10, category_slug: 'work' }];
        const wrapper = mount(TreemapChart, {
            props: { tasks }
        });
        
        // Ensure dimensions are picked up
        wrapper.vm.dimensions = { width: 800, height: 600 };
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.treemapRects.length).toBe(1);
        
        // Find the task block (it has a specific shadow/border class)
        const block = wrapper.find('.shadow-sm.cursor-pointer');
        await block.trigger('click');

        expect(mockPush).toHaveBeenCalledWith('/task/1');
    });

    it('handles mobile (portrait) dimensions correctly', async () => {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 300 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 900 });

        const tasks = [
            { id: 1, title: 'Big Task', calculatedPriority: 20 },
            { id: 2, title: 'Small 1', calculatedPriority: 5 },
            { id: 3, title: 'Small 2', calculatedPriority: 5 }
        ];

        const wrapper = mount(TreemapChart, {
            props: { tasks }
        });

        await wrapper.vm.$nextTick();
        const rects = wrapper.vm.treemapRects;

        // In squarified treemap, even in portrait, blocks shouldn't be too "thin"
        rects.forEach(r => {
            const aspectRatio = Math.max(r.w / r.h, r.h / r.w);
            // Squarified treemap usually keeps aspect ratio below 3-4 for small datasets
            expect(aspectRatio).toBeLessThan(5);
        });
    });
});

describe('TreemapChart — overdue day counter (#156)', () => {
    beforeEach(() => {
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 });
    });

    const render = async (tasks) => {
        const wrapper = mount(TreemapChart, { props: { tasks } });
        wrapper.vm.dimensions = { width: 800, height: 600 };
        await wrapper.vm.$nextTick();
        return wrapper;
    };

    const blockFor = (wrapper, title) =>
        wrapper.findAll('.shadow-sm.cursor-pointer').find(b => b.text().includes(title));

    it('shows the day count under the title', async () => {
        const wrapper = await render([
            { id: 1, title: 'Wash', calculatedPriority: 10, category_slug: 'work', days_overdue: 2 },
        ]);

        const block = blockFor(wrapper, 'Wash');
        expect(block.text()).toContain('(2)');
        expect(block.find('.text-\\[var\\(--color-danger\\)\\]').exists()).toBe(true);
    });

    it('scales the count to the block and shows nothing when not overdue', async () => {
        const wrapper = await render([
            { id: 1, title: 'Wash', calculatedPriority: 10, category_slug: 'work', days_overdue: 2 },
            { id: 2, title: 'Iron', calculatedPriority: 5, category_slug: 'work' },
        ]);

        const rect = wrapper.vm.treemapRects.find(r => r.task.id === 1);
        const counter = blockFor(wrapper, 'Wash').find('.text-\\[var\\(--color-danger\\)\\]');
        // `getFontSize` returns a CSS string, so the counter must not be derived from it by
        // arithmetic — this pins the px value rather than the `NaNpx` that would produce.
        expect(counter.attributes('style')).toBe(`font-size: ${parseFloat(wrapper.vm.getFontSize(rect)) * 0.85}px;`);

        expect(blockFor(wrapper, 'Iron').find('.text-\\[var\\(--color-danger\\)\\]').exists()).toBe(false);
    });
});
