import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import DailyPlanner from '../../../resources/js/components/DailyPlanner.vue';

describe('DailyPlanner Component', () => {
    const today = new Date().toISOString().substring(0, 10);

    const mountPlanner = (tasks = []) => mount(DailyPlanner, {
        props: { tasks },
        global: {
            stubs: { ColumnCard: true },
            mocks: { $t: (k) => k },
        },
    });

    it('splits tasks into today and unscheduled', () => {
        const tasks = [
            { id: 1, title: 'Today task', scheduled_date: today },
            { id: 2, title: 'Backlog task', scheduled_date: null },
        ];
        const wrapper = mountPlanner(tasks);
        expect(wrapper.vm.todayTasks).toHaveLength(1);
        expect(wrapper.vm.todayTasks[0].title).toBe('Today task');
        expect(wrapper.vm.unscheduledTasks).toHaveLength(1);
        expect(wrapper.vm.unscheduledTasks[0].title).toBe('Backlog task');
    });

    it('puts future dates in unscheduled', () => {
        const tasks = [
            { id: 1, title: 'Future', scheduled_date: '2099-01-01' },
        ];
        const wrapper = mountPlanner(tasks);
        expect(wrapper.vm.todayTasks).toHaveLength(0);
        expect(wrapper.vm.unscheduledTasks).toHaveLength(1);
    });

    it('calculates total estimated minutes for today', () => {
        const tasks = [
            { id: 1, title: 'A', scheduled_date: today, estimated_duration: 30 },
            { id: 2, title: 'B', scheduled_date: today, estimated_duration: 45 },
            { id: 3, title: 'C', scheduled_date: null, estimated_duration: 60 },
        ];
        const wrapper = mountPlanner(tasks);
        expect(wrapper.vm.totalMin).toBe(75);
    });

    it('handleMoveTask to today sets scheduled_date', () => {
        const wrapper = mountPlanner([]);
        wrapper.vm.handleMoveTask({ taskId: 1, toColumn: 'today' });
        expect(wrapper.emitted('update-task')).toBeTruthy();
        expect(wrapper.emitted('update-task')[0][0]).toEqual({
            taskId: 1,
            changes: { scheduled_date: today },
        });
    });

    it('handleMoveTask to unscheduled clears scheduled_date', () => {
        const wrapper = mountPlanner([]);
        wrapper.vm.handleMoveTask({ taskId: 1, toColumn: 'unscheduled' });
        expect(wrapper.emitted('update-task')[0][0]).toEqual({
            taskId: 1,
            changes: { scheduled_date: null },
        });
    });
});
