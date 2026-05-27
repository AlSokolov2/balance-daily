import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BubbleChart from '../../../resources/js/components/BubbleChart.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('BubbleChart Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.useFakeTimers();
        
        // Global mock for dimensions - essential for jsdom
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 800 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 600 });
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.unstubAllGlobals();
    });

    it('renders and shows "Нет задач" when empty', () => {
        const wrapper = mount(BubbleChart);
        expect(wrapper.text()).toContain('Нет задач');
    });

    it('emits "edit" when handleDesktopClick is called', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        
        await wrapper.vm.handleDesktopClick(task);

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 1 });
    });

    it('manages tooltip state via toggleTooltip', async () => {
        const task = { id: 1, title: 'Task 1', notes: 'Secret note' };
        const wrapper = mount(BubbleChart);
        
        // Initial state
        expect(wrapper.vm.tooltip.visible).toBe(false);

        // Mock event and calc
        const event = { stopPropagation: vi.fn() };
        // Manual call to showTooltip logic (via toggle)
        wrapper.vm.bubblePositions = [{ id: 1, x: 100, y: 100, size: 50 }];
        
        await wrapper.vm.toggleTooltip(event, task);
        expect(wrapper.vm.tooltip.visible).toBe(true);
        expect(wrapper.vm.tooltip.text).toBe('Secret note');

        // Toggle off
        await wrapper.vm.toggleTooltip(event, task);
        expect(wrapper.vm.tooltip.visible).toBe(false);
    });

    it('triggers edit on long press in mobile mode', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        
        // Mock isTouchDevice
        wrapper.vm.isTouchDevice = true;

        await wrapper.vm.handleTouchStart({}, task);
        
        // Wait for long press timer
        vi.advanceTimersByTime(501);
        
        expect(wrapper.emitted('edit')).toBeTruthy();
    });

    it('cancels long press if touch ends early', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        wrapper.vm.isTouchDevice = true;

        await wrapper.vm.handleTouchStart({}, task);
        vi.advanceTimersByTime(200); // Only 200ms passed
        await wrapper.vm.handleTouchEnd({}, task);
        
        vi.advanceTimersByTime(400); // Total > 500ms now
        
        expect(wrapper.emitted('edit')).toBeFalsy();
    });
});
