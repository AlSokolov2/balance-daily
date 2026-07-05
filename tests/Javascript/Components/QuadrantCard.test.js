import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import QuadrantCard from '../../../resources/js/components/QuadrantCard.vue';

describe('QuadrantCard Component', () => {
    const mountCard = (props = {}) => {
        return mount(QuadrantCard, {
            props: {
                tasks: [],
                label: 'Test Quadrant',
                color: '#ef4444',
                variant: 'solid',
                quadrant: 'q1',
                ...props,
            },
            global: {
                mocks: { $t: (k) => k },
            },
        });
    };

    it('renders label and empty state', () => {
        const wrapper = mountCard();
        expect(wrapper.html()).toContain('Test Quadrant');
        expect(wrapper.html()).toContain('0');
    });

    it('renders task count', () => {
        const wrapper = mountCard({
            tasks: [{ id: 1, title: 'Task 1', importance: 2 }, { id: 2, title: 'Task 2', importance: 3 }],
            label: 'Do First',
            color: '#ef4444',
        });
        expect(wrapper.html()).toContain('2');
        expect(wrapper.html()).toContain('Task 1');
        expect(wrapper.html()).toContain('Task 2');
    });

    it('emits edit event when task is clicked', async () => {
        const wrapper = mountCard({
            tasks: [{ id: 1, title: 'Click me', importance: 3 }],
            label: 'Test',
            color: '#000',
        });
        await wrapper.find('.rounded-lg').trigger('click');
        expect(wrapper.emitted('edit')).toBeTruthy();
        expect(wrapper.emitted('edit')[0][0]).toEqual({ id: 1, title: 'Click me', importance: 3 });
    });

    it('shows dash for empty quadrant', () => {
        const wrapper = mountCard({ tasks: [], label: 'Empty' });
        expect(wrapper.html()).toContain('—');
    });

    it('renders task category color when available', () => {
        const wrapper = mountCard({
            tasks: [{ id: 1, title: 'Colored', category_color: '#a855f7', importance: 2 }],
            label: 'Test',
            color: '#000',
        });
        const dot = wrapper.find('.w-1\\.5');
        expect(dot.attributes('style')).toContain('background-color: rgb(168, 85, 247)');
    });
});
