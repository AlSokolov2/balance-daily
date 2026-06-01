import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../../resources/js/App.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

// Mock components
vi.mock('../../resources/js/components/BubbleChart.vue', () => ({
    default: { name: 'BubbleChart', template: '<div class="bubble-chart-mock"></div>' }
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
vi.mock('../../resources/js/components/MobileBottomNav.vue', () => ({
    default: { name: 'MobileBottomNav', template: '<div class="bottom-nav-mock"></div>' }
}));
vi.mock('../../resources/js/components/AuthScreen.vue', () => ({
    default: { name: 'AuthScreen', template: '<div class="auth-screen-mock"></div>' }
}));

describe('UI State Reset Logic (Issue #48)', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        store.token = 'fake-token';
        store.user = { name: 'Test User' };
        
        // Ensure clean state for handheld detection
        delete window.ontouchstart;
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
        Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, configurable: true, value: 0 });

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

    it('expands list and hides chart when switching to archive in Desktop mode', async () => {
        const wrapper = mount(App);
        // Force bypass initialization
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();

        // Initial state: Desktop, filter 'all'
        expect(store.isAuthenticated).toBe(true);
        expect(wrapper.vm.isHandheld).toBe(false);
        expect(wrapper.find('.bubble-chart-mock').exists()).toBe(true);
        expect(wrapper.vm.showTaskList).toBe(false);

        // Switch to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.showTaskList).toBe(true);
        expect(wrapper.find('.bubble-chart-mock').exists()).toBe(false);
        
        // Task list card should have flex-1 and max-h-none classes
        const taskListCard = wrapper.find('.card');
        expect(taskListCard.classes()).toContain('flex-1');
        expect(taskListCard.classes()).toContain('max-h-none');
    });

    it('collapses list and shows chart when switching back from archive to all', async () => {
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();

        // 1. Go to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();
        expect(wrapper.vm.showTaskList).toBe(true);

        // 2. Go back to all
        store.filterCat = 'all';
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.showTaskList).toBe(false);
        expect(wrapper.find('.bubble-chart-mock').exists()).toBe(true);
    });

    it('hides chart screen in handheld mode for archive category', async () => {
        // Mock handheld
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
        Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
        window.ontouchstart = () => {};
        
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.isHandheld).toBe(true);
        
        // Initially 'all' category, Screen 1 (chart) exists
        expect(wrapper.find('.bubble-chart-mock').exists()).toBe(true);

        // Switch to archive
        store.filterCat = 'archive';
        await wrapper.vm.$nextTick();

        // Screen 1 should be gone due to v-if
        expect(wrapper.find('.bubble-chart-mock').exists()).toBe(false);
    });
});
