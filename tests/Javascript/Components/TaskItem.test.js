import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TaskItem from '../../../resources/js/components/TaskItem.vue';
import BaseBadge from '../../../resources/js/components/BaseBadge.vue';
import BaseButton from '../../../resources/js/components/BaseButton.vue';

describe('TaskItem Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    const mockTask = {
        id: 1,
        title: 'Test Task',
        category_slug: 'work',
        importance: 2,
        calculatedPriority: 5.5,
        completed: false,
        missed_count: 1,
        repeat_type: 'interval'
    };

    it('renders task title and badges correctly', () => {
        const wrapper = mount(TaskItem, {
            props: { task: mockTask }
        });

        expect(wrapper.text()).toContain('Test Task');
        const badge = wrapper.findComponent(BaseBadge);
        expect(badge.exists()).toBe(true);
        expect(badge.text()).toContain('task.status.missed');
    });

    it('emits edit event when edit button is clicked', async () => {
        const wrapper = mount(TaskItem, {
            props: { task: mockTask }
        });

        // Find the edit button — BaseButton with icon="edit"
        const buttons = wrapper.findAllComponents(BaseButton);
        const editBtn = buttons.find(b => b.props('icon') === 'edit');
        expect(editBtn).toBeTruthy();
        await editBtn.trigger('click');

        expect(wrapper.emitted()).toHaveProperty('edit');
        expect(wrapper.emitted('edit')[0][0]).toEqual(mockTask);
    });
});
