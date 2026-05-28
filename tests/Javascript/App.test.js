import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import App from '../../resources/js/App.vue';
import { useBalanceStore } from '../../resources/js/stores/balance';

// Mock components that might be complex or require separate testing
vi.mock('./components/BubbleChart.vue', () => ({
    default: { template: '<div class="bubble-chart-mock"></div>' }
}));
vi.mock('./components/EditTaskModal.vue', () => ({
    default: { template: '<div class="modal-mock"></div>' }
}));
vi.mock('./components/SettingsModal.vue', () => ({
    default: { template: '<div class="settings-mock"></div>' }
}));

describe('App Component - Handheld & Orientation', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.user = { name: 'Test User', avatar: 'avatar.jpg' };
        // Mock computed isAuthenticated
        vi.spyOn(store, 'isAuthenticated', 'get').mockReturnValue(true);
        
        // Reset window properties
        Object.defineProperty(window, 'innerWidth', { writable: true, configurable: true, value: 1024 });
        Object.defineProperty(window, 'innerHeight', { writable: true, configurable: true, value: 768 });
        Object.defineProperty(navigator, 'maxTouchPoints', { writable: true, configurable: true, value: 0 });
    });

    it('detects desktop correctly (no touch, large screen)', async () => {
        // Ensure no touch support is simulated
        delete window.ontouchstart;
        const wrapper = mount(App);
        // Force bypass initialization
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.isHandheld).toBe(false);
        expect(wrapper.find('.action-bar').exists()).toBe(true);
    });

    it('detects handheld correctly via touch support', async () => {
        Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.isHandheld).toBe(true);
        expect(wrapper.find('.action-bar').exists()).toBe(false);
    });

    it('detects handheld correctly via small screen width', async () => {
        Object.defineProperty(window, 'innerWidth', { configurable: true, value: 500 });
        const wrapper = mount(App);
        wrapper.vm.isInitializing = false;
        await wrapper.vm.$nextTick();
        
        expect(wrapper.vm.isHandheld).toBe(true);
    });
it('hides header on handheld mode', async () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
    const wrapper = mount(App);
    wrapper.vm.isInitializing = false;
    await wrapper.vm.$nextTick();

    expect(wrapper.find('header').exists()).toBe(false);
});

it('renders unified bottom bar on handheld', async () => {
    Object.defineProperty(navigator, 'maxTouchPoints', { configurable: true, value: 5 });
    const wrapper = mount(App);
    wrapper.vm.isInitializing = false;
    await wrapper.vm.$nextTick();

    const bottomBar = wrapper.find('.z-\\[60\\]');
    expect(bottomBar.exists()).toBe(true);
    expect(bottomBar.find('select').exists()).toBe(true); // Filter
    expect(bottomBar.find('img').exists()).toBe(true);    // Avatar
});
});
