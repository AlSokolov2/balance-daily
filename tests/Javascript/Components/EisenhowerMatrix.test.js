import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import EisenhowerMatrix from '../../../resources/js/components/EisenhowerMatrix.vue';

describe('EisenhowerMatrix Component', () => {
    const mountMatrix = (tasks = []) => {
        return mount(EisenhowerMatrix, {
            props: { tasks },
            global: {
                stubs: { QuadrantCard: true },
                mocks: { $t: (k) => k },
            },
        });
    };

    it('renders the matrix structure', () => {
        const wrapper = mountMatrix([]);
        expect(wrapper.html()).toContain('eisenhower');
    });

    it('classifies urgent+important tasks into Q1', () => {
        const wrapper = mountMatrix([
            { id: 1, title: 'Urgent+Important', urgency: 'urgent', importance: 3 },
        ]);
        const q1 = wrapper.vm.quadrants.q1;
        expect(q1).toHaveLength(1);
        expect(q1[0].title).toBe('Urgent+Important');
    });

    it('classifies not-urgent+important tasks into Q2', () => {
        const wrapper = mountMatrix([
            { id: 2, title: 'Plan', urgency: 'not_urgent', importance: 3 },
        ]);
        const q2 = wrapper.vm.quadrants.q2;
        expect(q2).toHaveLength(1);
        expect(q2[0].title).toBe('Plan');
    });

    it('classifies urgent+not-important tasks into Q3', () => {
        const wrapper = mountMatrix([
            { id: 3, title: 'Delegate', urgency: 'urgent', importance: 1 },
        ]);
        const q3 = wrapper.vm.quadrants.q3;
        expect(q3).toHaveLength(1);
        expect(q3[0].title).toBe('Delegate');
    });

    it('classifies not-urgent+not-important tasks into Q4', () => {
        const wrapper = mountMatrix([
            { id: 4, title: 'Eliminate', urgency: 'not_urgent', importance: 1 },
        ]);
        const q4 = wrapper.vm.quadrants.q4;
        expect(q4).toHaveLength(1);
        expect(q4[0].title).toBe('Eliminate');
    });

    it('defaults urgency to not_urgent when missing', () => {
        const wrapper = mountMatrix([
            { id: 5, title: 'No urgency field', importance: 3 },
        ]);
        // Missing urgency → not_urgent → Q2 (important)
        expect(wrapper.vm.quadrants.q2).toHaveLength(1);
        expect(wrapper.vm.quadrants.q1).toHaveLength(0);
    });

    it('splits mixed tasks across all four quadrants', () => {
        const tasks = [
            { id: 1, title: 'Q1', urgency: 'urgent', importance: 3 },
            { id: 2, title: 'Q2', urgency: 'not_urgent', importance: 3 },
            { id: 3, title: 'Q3', urgency: 'urgent', importance: 1 },
            { id: 4, title: 'Q4', urgency: 'not_urgent', importance: 1 },
        ];
        const wrapper = mountMatrix(tasks);
        const q = wrapper.vm.quadrants;
        expect(q.q1).toHaveLength(1);
        expect(q.q2).toHaveLength(1);
        expect(q.q3).toHaveLength(1);
        expect(q.q4).toHaveLength(1);
    });
});
