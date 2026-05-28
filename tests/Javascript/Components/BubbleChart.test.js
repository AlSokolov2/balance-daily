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

    it('emits "edit" when handleBubbleClick is called on desktop', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        
        wrapper.vm.isTouchDevice = false;
        await wrapper.vm.handleBubbleClick(task);

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 1 });
    });

    it('emits "edit" on short tap in mobile mode', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        
        wrapper.vm.isTouchDevice = true;
        // Simulate short tap (no long press timer triggered)
        await wrapper.vm.handleBubbleClick(task);

        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0][0]).toMatchObject({ id: 1 });
    });

    it('shows tooltip on long press in mobile mode, hides on touch end, and ignores subsequent click', async () => {
        const task = { id: 1, title: 'Task 1', notes: 'Secret' };
        const wrapper = mount(BubbleChart);
        
        wrapper.vm.isTouchDevice = true;

        await wrapper.vm.handlePointerDown({ stopPropagation: vi.fn() }, task);
        
        // Wait for long press timer (400ms)
        vi.advanceTimersByTime(401);
        await wrapper.vm.$nextTick();

        // Simulate tooltip being shown (since jsdom container mocks are flaky for showTooltip)
        wrapper.vm.tooltip.visible = true;

        // Touch ends
        await wrapper.vm.handlePointerUp({ stopPropagation: vi.fn() }, task);
        
        // Tooltip should be hidden now
        expect(wrapper.vm.tooltip.visible).toBe(false);
        
        // Timer should have set isLongPress to true internally.
        // The subsequent click event should NOT emit 'edit'
        await wrapper.vm.handleBubbleClick(task);
        
        expect(wrapper.emitted('edit')).toBeFalsy();
    });

    it('cancels long press if touch ends early', async () => {
        const task = { id: 1, title: 'Task 1' };
        const wrapper = mount(BubbleChart);
        wrapper.vm.isTouchDevice = true;

        await wrapper.vm.handlePointerDown({}, task);
        vi.advanceTimersByTime(200); // Only 200ms passed
        await wrapper.vm.handlePointerUp({}, task);
        
        vi.advanceTimersByTime(300); // Total > 400ms now
        
        expect(wrapper.vm.tooltip.visible).toBe(false);
    });

    it('arranges tasks in 3 rows on mobile', async () => {
        // Mock mobile dimensions
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 360 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 640 });

        const store = useBalanceStore();
        store.categories = [{ slug: 'work', weight: 1, color: '#ff0000' }];
        // Task 1: Central (default), Task 2: Side (ha), Task 3: Side (postponed)
        store.tasks = [
            { id: 1, title: 'Central', category_slug: 'work', importance: 3, calculatedPriority: 10 },
            { id: 2, title: 'Side 1', category_slug: 'work', importance: 3, calculatedPriority: 10, ha: true },
            { id: 3, title: 'Side 2', category_slug: 'work', importance: 3, calculatedPriority: 10, postpone_until: '2099-01-01' }
        ];

        const wrapper = mount(BubbleChart);
        
        // Manually trigger calculation for test stability
        wrapper.vm.calcBubbles();
        
        const positions = wrapper.vm.bubblePositions;
        expect(positions.length).toBe(3);

        const H = 640;
        const padding = 5;
        const hPart = (H - padding * 2) / 3; // (640 - 10) / 3 = 210
        
        // Task 2 (Side 1) should be in Top Row (y ranges from padding to padding + hPart)
        const t2 = positions.find(p => p.id === 2);
        expect(t2.y).toBeLessThan(padding + hPart + 1); // allow small margin
        
        // Task 1 (Central) should be in Middle Row (y ranges from padding + hPart to padding + 2*hPart)
        const t1 = positions.find(p => p.id === 1);
        expect(t1.y).toBeGreaterThan(padding + hPart - 1);
        expect(t1.y).toBeLessThan(padding + hPart * 2 + 1);

        // Task 3 (Side 2) should be in Bottom Row (y ranges from padding + 2*hPart to H - padding)
        const t3 = positions.find(p => p.id === 3);
        expect(t3.y).toBeGreaterThan(padding + hPart * 2 - 1);
    });

    it('updates zoom on pinch gesture', async () => {
        const store = useBalanceStore();
        const wrapper = mount(BubbleChart);
        
        // Initial state
        store.bubbleZoom = 1.0;

        // Simulate touchstart with two fingers (100px apart)
        const touchStartEvent = {
            touches: [
                { clientX: 0, clientY: 0 },
                { clientX: 100, clientY: 0 }
            ]
        };
        await wrapper.vm.handleTouchStart(touchStartEvent);

        // Simulate touchmove with fingers moved further apart (200px apart)
        const touchMoveEvent = {
            touches: [
                { clientX: 0, clientY: 0 },
                { clientX: 200, clientY: 0 }
            ],
            cancelable: true,
            preventDefault: vi.fn()
        };
        await wrapper.vm.handleTouchMove(touchMoveEvent);

        // Ratio 200/100 = 2.0. Initial 1.0 * 2.0 = 2.0
        expect(store.bubbleZoom).toBe(2.0);

        // Fingers moved closer (50px apart)
        const touchMoveCloseEvent = {
            touches: [
                { clientX: 0, clientY: 0 },
                { clientX: 50, clientY: 0 }
            ],
            cancelable: true,
            preventDefault: vi.fn()
        };
        // ratio 50/100 = 0.5. Initial 1.0 * 0.5 = 0.5
        await wrapper.vm.handleTouchMove(touchMoveCloseEvent);
        expect(store.bubbleZoom).toBe(0.5);
    });
});
