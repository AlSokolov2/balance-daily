import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import TaskItem from '../../../resources/js/components/TaskItem.vue';
import BaseBadge from '../../../resources/js/components/BaseBadge.vue';
import BaseButton from '../../../resources/js/components/BaseButton.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';

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

    it('offers "return now" instead of "restore" for a completed hidden task (#205)', async () => {
        const store = useBalanceStore();
        const returnNowSpy = vi.spyOn(store, 'returnNow').mockResolvedValue();
        const restoreSpy = vi.spyOn(store, 'restoreTask').mockResolvedValue();

        const wrapper = mount(TaskItem, {
            props: {
                task: {
                    ...mockTask,
                    completed: true,
                    completed_at: new Date(Date.now() - 86_400_000).toISOString(),
                    hidden_until: new Date(Date.now() + 86_400_000).toISOString(),
                },
            },
        });

        // Both actions use the same icon; only one should be rendered.
        const actions = wrapper.findAllComponents(BaseButton).filter(b => b.props('icon') === 'restore');
        expect(actions).toHaveLength(1);

        await actions[0].trigger('click');

        expect(returnNowSpy).toHaveBeenCalledWith(1);
        expect(restoreSpy).not.toHaveBeenCalled();
    });

    it('offers "restore" for an archived task and no "return now"', async () => {
        const store = useBalanceStore();
        const returnNowSpy = vi.spyOn(store, 'returnNow').mockResolvedValue();
        const restoreSpy = vi.spyOn(store, 'restoreTask').mockResolvedValue();

        const wrapper = mount(TaskItem, {
            props: {
                task: {
                    ...mockTask,
                    completed: true,
                    completed_at: new Date(Date.now() - 86_400_000).toISOString(),
                },
            },
        });

        const actions = wrapper.findAllComponents(BaseButton).filter(b => b.props('icon') === 'restore');
        expect(actions).toHaveLength(1);

        await actions[0].trigger('click');

        expect(restoreSpy).toHaveBeenCalledWith(1);
        expect(returnNowSpy).not.toHaveBeenCalled();
    });
});
