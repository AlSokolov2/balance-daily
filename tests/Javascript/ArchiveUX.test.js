import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../../resources/js/App.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

vi.mock('../../resources/js/components/BubbleChart.vue', () => ({
    default: { template: '<div class="bubble-chart-mock"></div>' }
}));

describe('Archive UX Fix', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.user = { name: 'Test User', avatar: 'avatar.jpg' };
        vi.spyOn(store, 'isAuthenticated', 'get').mockReturnValue(true);
        
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

    it('automatically opens task list on desktop when Archive filter is selected', async () => {
        Object.defineProperty(window, 'innerWidth', { value: 1024 });
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();
        
        const store = useBalanceStore();
        expect(wrapper.vm.showTaskList).toBe(false);
        
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.showTaskList).toBe(true);
    });

    it('automatically scrolls to list view on mobile when Archive filter is selected', async () => {
        const wrapper = mount(App, {
            attachTo: document.body
        });
        wrapper.vm.isInitializing = false;
        wrapper.vm.isHandheld = true;
        await wrapper.vm.$nextTick();
        
        const scrollContainer = wrapper.find('.mobile-scroll-container');
        expect(scrollContainer.exists()).toBe(true);
        
        // Mock scrollLeft setter since JSDOM doesn't handle it
        let targetScroll = 0;
        Object.defineProperty(scrollContainer.element, 'scrollLeft', {
            set: (v) => { targetScroll = v; },
            get: () => targetScroll
        });
        Object.defineProperty(scrollContainer.element, 'clientWidth', {
            value: 375
        });
        
        const store = useBalanceStore();
        store.filterCat = 'archive';
        
        // Wait for watcher
        await wrapper.vm.$nextTick();
        // Wait for nextTick inside scrollToList
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.showTaskList).toBe(true);
        expect(targetScroll).toBe(375);
        
        wrapper.unmount();
    });
});
