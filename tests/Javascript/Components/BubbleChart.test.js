import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import BubbleChart from '../../../resources/js/components/BubbleChart.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('BubbleChart Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        // Mock clientWidth/Height which are 0 in jsdom
        Object.defineProperty(HTMLElement.prototype, 'clientWidth', { configurable: true, value: 500 });
        Object.defineProperty(HTMLElement.prototype, 'clientHeight', { configurable: true, value: 300 });
    });

    it('renders and shows "Нет задач" when empty', () => {
        const wrapper = mount(BubbleChart);
        expect(wrapper.text()).toContain('Нет задач');
    });

    it('renders bubbles for active tasks', async () => {
        const store = useBalanceStore();
        store.categories = [{ slug: 'work', name: 'Work', weight: 1.0, color: '#ff0000' }];
        store.tasks = [
            { id: 1, title: 'Task 1', category_slug: 'work', importance: 2, completed: false, calculatedPriority: 10 }
        ];

        const wrapper = mount(BubbleChart);
        
        // Wait for nextTick and internal setTimeout
        await new Promise(r => setTimeout(r, 200));

        const bubbles = wrapper.findAll('.bubble');
        expect(bubbles.length).toBe(1);
        expect(bubbles[0].text()).toContain('Task 1');
    });
});
