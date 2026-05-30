import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../../resources/js/App.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

vi.mock('../../resources/js/components/BubbleChart.vue', () => ({
    default: { template: '<div class="bubble-chart-mock"></div>' }
}));

describe('Manual Refresh Logic', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.token = 'fake-token';
        store.user = { name: 'Test User' };
        
        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
            })),
        });
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('refreshes data when visibility changes to visible', async () => {
        const store = useBalanceStore();
        // Mock fetchAll BEFORE mounting
        const spy = vi.spyOn(store, 'fetchAll').mockResolvedValue({});
        
        // Use a flag to track if it's the second call (from sync)
        mount(App);
        
        // Wait for setup/init
        await new Promise(resolve => setTimeout(resolve, 0));

        // Clear initial call from init()
        spy.mockClear();

        // Simulate visibility change
        Object.defineProperty(document, 'visibilityState', { value: 'visible', configurable: true });
        document.dispatchEvent(new Event('visibilitychange'));
        
        expect(spy).toHaveBeenCalled();
    });

    it('triggers refresh on pull-to-refresh gesture', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(store, 'fetchAll').mockResolvedValue({});
        
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        wrapper.vm.isHandheld = true;
        await wrapper.vm.$nextTick();

        // Get the scrollable container
        const container = wrapper.find('.overflow-y-auto');
        
        // Simulate Pull Down
        await container.trigger('touchstart', {
            touches: [{ clientY: 100 }]
        });
        await container.trigger('touchmove', {
            touches: [{ clientY: 300 }] // 200px pull
        });
        
        expect(wrapper.vm.pullDistance).toBeGreaterThan(50);
        
        await container.trigger('touchend', {
            changedTouches: [{ clientY: 300 }]
        });
        
        expect(spy).toHaveBeenCalled();
    });
});
