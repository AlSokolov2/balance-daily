import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
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

describe('Manual Refresh Logic', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.token = 'fake-token';
        store.user = { name: 'Test User' };
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('triggers refresh on pull-to-refresh gesture', async () => {
        const store = useBalanceStore();
        const spy = vi.spyOn(store, 'fetchAll').mockResolvedValue({});
        
        const wrapper = mount(MainView, {
            props: { isHandheld: true }
        });
        await wrapper.vm.$nextTick();

        // Get the scrollable container
        const container = wrapper.find('.task-list-container');
        
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
