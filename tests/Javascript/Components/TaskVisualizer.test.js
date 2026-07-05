import { describe, it, expect, beforeEach, beforeAll, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { registerPlugin } from '../../../resources/js/plugins/vizPluginRegistry.js';
import { useUiStore } from '../../../resources/js/stores/ui.js';
import TaskVisualizer from '../../../resources/js/components/TaskVisualizer.vue';

const StubComponent = {
    template: '<div class="stub-plugin">Plugin Loaded</div>',
};

describe('TaskVisualizer Component', () => {
    beforeAll(() => {
        registerPlugin({
            name: 'test-viz',
            label: { ru: 'Тест', en: 'Test' },
            loader: async () => StubComponent,
            version: '1.0.0',
            getter: (store) => store.bubbleTasks,
            source: { type: 'builtin', name: 'test-viz' },
        });
    });

    beforeEach(() => {
        setActivePinia(createPinia());
    });

    function mountViz(props = {}) {
        return mount(TaskVisualizer, {
            props,
            global: {
                stubs: {
                    AppIcon: true,
                    AppSkeleton: true,
                    BaseButton: true,
                },
            },
        });
    }

    it('plugin computed resolves when plugin is registered', () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz();
        expect(wrapper.vm.plugin).toBeDefined();
        expect(wrapper.vm.plugin.name).toBe('test-viz');
    });

    it('plugin computed returns null when plugin is not registered', () => {
        useUiStore().setVisualStyle('nonexistent');
        const wrapper = mountViz();
        expect(wrapper.vm.plugin).toBeNull();
    });

    it('currentComponent is not null when plugin is found', () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz();
        expect(wrapper.vm.currentComponent).not.toBeNull();
    });

    it('currentComponent is null when plugin is not found', () => {
        useUiStore().setVisualStyle('nonexistent');
        const wrapper = mountViz();
        expect(wrapper.vm.currentComponent).toBeNull();
    });

    it('resolves tasks from prop when provided', () => {
        useUiStore().setVisualStyle('test-viz');
        const tasks = [{ id: 1, title: 'Custom Task' }];
        const wrapper = mountViz({ tasks });
        expect(wrapper.vm.resolvedTasks).toEqual(tasks);
    });

    it('uses plugin getter when no tasks prop', () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz();
        const resolved = wrapper.vm.resolvedTasks;
        expect(Array.isArray(resolved)).toBe(true);
    });

    it('pluginMode uses explicit prop over plugin default', () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz({ mode: 'single' });
        expect(wrapper.vm.pluginMode).toBe('single');
    });

    it('pluginMode falls back to plugin defaultSettings', () => {
        useUiStore().setVisualStyle('test-viz');
        // test-viz has defaultSettings: undefined, so falls back to 'combined'
        const wrapper = mountViz();
        expect(wrapper.vm.pluginMode).toBe('combined');
    });

    it('error boundary sets error state', async () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz();

        expect(wrapper.vm.error).toBeNull();

        // Simulate error caught by onErrorCaptured
        const testError = new Error('Test error');
        wrapper.vm.error = testError;
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.error).toBe(testError);
        expect(wrapper.html()).toContain('app.viz_load_error');
    });

    it('retry clears error and increments retryCount', async () => {
        useUiStore().setVisualStyle('test-viz');
        const wrapper = mountViz();

        wrapper.vm.error = new Error('Test error');
        wrapper.vm.retryCount = 0;
        await wrapper.vm.$nextTick();

        await wrapper.vm.retry();
        await wrapper.vm.$nextTick();

        expect(wrapper.vm.error).toBeNull();
        expect(wrapper.vm.retryCount).toBe(1);
    });
});
