import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import MainView from '../../resources/js/views/MainView.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

// Mock components
vi.mock('../../resources/js/components/TaskVisualizer.vue', () => ({
    default: { name: 'TaskVisualizer', template: '<div class="task-visualizer-mock"></div>' }
}));
vi.mock('../../resources/js/components/TaskItem.vue', () => ({
    default: { name: 'TaskItem', template: '<div class="task-item-mock"></div>' }
}));
vi.mock('../../resources/js/components/AppHeader.vue', () => ({
    default: { name: 'AppHeader', template: '<div class="header-mock"></div>' }
}));
vi.mock('../../resources/js/components/DesktopFilterBar.vue', () => ({
    default: { name: 'DesktopFilterBar', template: '<div class="filter-bar-mock"></div>' }
}));
vi.mock('../../resources/js/components/DesktopAddForm.vue', () => ({
    default: { name: 'DesktopAddForm', template: '<div class="add-form-mock"></div>' }
}));

describe('UI State Reset Logic (Issue #48)', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        store.token = 'fake-token';
        store.user = { name: 'Test User' };
    });

    it('expands list and hides chart when switching to archive in Desktop mode', async () => {
        const wrapper = mount(MainView, {
            props: { isHandheld: false }
        });
        await wrapper.vm.$nextTick();

        // Initial state: Desktop, filter 'all'
        expect(wrapper.find('.task-visualizer-mock').exists()).toBe(true);
        expect(wrapper.vm.showTaskList).toBe(false);

        // Switch to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.showTaskList).toBe(true);
        expect(wrapper.find('.task-visualizer-mock').exists()).toBe(false);
        
        // Task list card should have flex-1 for archive, NOT max-h-[40vh]
        const taskListCard = wrapper.find('.card');
        expect(taskListCard.classes()).toContain('flex-1');
        expect(taskListCard.classes()).not.toContain('max-h-[40vh]');
    });

    it('collapses list and shows chart when switching back from archive to all', async () => {
        const wrapper = mount(MainView, {
            props: { isHandheld: false }
        });
        await wrapper.vm.$nextTick();

        // 1. Go to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.showTaskList).toBe(true);

        // 2. Go back to all
        store.filterCat = 'all';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.showTaskList).toBe(false);
        expect(wrapper.find('.task-visualizer-mock').exists()).toBe(true);
    });

    it('hides chart screen in handheld mode for archive category', async () => {
        const wrapper = mount(MainView, {
            props: { isHandheld: true }
        });
        await wrapper.vm.$nextTick();
        
        // Initially 'all' category, Screen 1 (chart) exists
        expect(wrapper.find('.task-visualizer-mock').exists()).toBe(true);

        // Switch to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();

        // Screen 1 should be gone due to v-if
        expect(wrapper.find('.task-visualizer-mock').exists()).toBe(false);
    });
});
