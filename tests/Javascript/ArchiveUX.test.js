import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MainView from '../../resources/js/views/MainView.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

vi.mock('../../resources/js/components/BubbleChart.vue', () => ({
    default: { template: '<div class="bubble-chart-mock"></div>' }
}));
vi.mock('../../resources/js/components/TaskItem.vue', () => ({
    default: { template: '<div class="task-item-mock"></div>' }
}));

describe('Archive UX Fix', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.user = { name: 'Test User', avatar: 'avatar.jpg' };
        vi.spyOn(store, 'isAuthenticated', 'get').mockReturnValue(true);
    });

    it('automatically opens task list on desktop when Archive filter is selected', async () => {
        const wrapper = mount(MainView, {
            props: { isHandheld: false }
        });
        
        const store = useBalanceStore();
        expect(wrapper.vm.showTaskList).toBe(false);
        
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.showTaskList).toBe(true);
    });

    it('automatically scrolls to list view on mobile when Archive filter is selected', async () => {
        const wrapper = mount(MainView, {
            props: { isHandheld: true },
            attachTo: document.body
        });
        
        const scrollContainer = wrapper.find('.mobile-scroll-container');
        expect(scrollContainer.exists()).toBe(true);
        
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
        
        await wrapper.vm.$nextTick();
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.showTaskList).toBe(true);
        expect(targetScroll).toBe(375);
        
        wrapper.unmount();
    });
});
