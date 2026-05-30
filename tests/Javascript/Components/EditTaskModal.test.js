import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import EditTaskModal from '../../../resources/js/components/EditTaskModal.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('EditTaskModal Component', () => {
    const mockTask = {
        id: 1,
        title: 'Original Task',
        notes: 'Some notes',
        category_slug: 'work',
        importance: 2,
        repeat_type: 'none'
    };

    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.categories = [
            { slug: 'work', name: 'Work' }
        ];
    });

    it('renders task title in fixed header', () => {
        const wrapper = mount(EditTaskModal, {
            props: { task: mockTask, isNew: false }
        });
        
        const titleInput = wrapper.find('input[type="text"]');
        expect(titleInput.element.value).toBe('Original Task');
    });

    it('switches tabs correctly', async () => {
        const wrapper = mount(EditTaskModal, {
            props: { task: mockTask, isNew: false }
        });

        // Default tab is 'notes'
        expect(wrapper.find('textarea').exists()).toBe(true);
        expect(wrapper.find('select').exists()).toBe(false);

        // Click 'Setup' tab
        const buttons = wrapper.findAll('button');
        const setupTab = buttons.find(b => b.text() === 'edit_task.tabs.setup');
        await setupTab.trigger('click');

        expect(wrapper.find('textarea').exists()).toBe(false);
        expect(wrapper.find('select').exists()).toBe(true);
    });

    it('switches tabs on horizontal swipe', async () => {
        const wrapper = mount(EditTaskModal, {
            props: { task: mockTask, isNew: false }
        });

        const content = wrapper.find('.flex-1.overflow-y-auto');
        
        // Swipe Left (Next tab)
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 100 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 100, clientY: 100 }]
        });
        
        expect(wrapper.vm.activeTab).toBe('setup');

        // Swipe Left again
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 100 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 100, clientY: 100 }]
        });
        
        expect(wrapper.vm.activeTab).toBe('schedule');

        // Swipe Right (Prev tab)
        await content.trigger('touchstart', {
            touches: [{ clientX: 100, clientY: 100 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 200, clientY: 100 }]
        });
        
        expect(wrapper.vm.activeTab).toBe('setup');
    });

    it('does not switch tabs on vertical swipe', async () => {
        const wrapper = mount(EditTaskModal, {
            props: { task: mockTask, isNew: false }
        });

        const content = wrapper.find('.flex-1.overflow-y-auto');
        
        // Vertical swipe
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 300 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 200, clientY: 100 }]
        });
        
        expect(wrapper.vm.activeTab).toBe('notes');
    });

    it('contains a fixed save button in footer', () => {
        const wrapper = mount(EditTaskModal, {
            props: { task: mockTask, isNew: false }
        });
        
        const saveBtn = wrapper.findAll('button').find(b => b.text().includes('common.save'));
        expect(saveBtn.exists()).toBe(true);
    });
});
