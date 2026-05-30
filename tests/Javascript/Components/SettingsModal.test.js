import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import SettingsModal from '../../../resources/js/components/SettingsModal.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

describe('SettingsModal Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.categories = [
            { slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30' },
            { slug: 'prog', name: 'PROG', weight: 0.87, color: '#34c759' },
            { slug: '__archive__', name: 'Архив', weight: 0.01, color: '#8e8e93' }
        ];

        // Mock matchMedia
        Object.defineProperty(window, 'matchMedia', {
            writable: true,
            value: vi.fn().mockImplementation(query => ({
                matches: false,
                media: query,
                onchange: null,
                addListener: vi.fn(),
                removeListener: vi.fn(),
                addEventListener: vi.fn(),
                removeEventListener: vi.fn(),
                dispatchEvent: vi.fn(),
            })),
        });
    });

    it('switches tabs correctly', async () => {
        const wrapper = mount(SettingsModal);
        // Default tab is 'gen'
        expect(wrapper.text()).toContain('settings.general.appearance');

        // Click 'cat' tab
        const buttons = wrapper.findAll('button');
        const catTab = buttons.find(b => b.text().includes('settings.tabs.cat'));
        await catTab.trigger('click');
        expect(wrapper.vm.tab).toBe('cat');

        // Click 'notepad' tab
        const notepadTab = buttons.find(b => b.text().includes('settings.tabs.notepad'));
        await notepadTab.trigger('click');
        expect(wrapper.vm.tab).toBe('notepad');
        expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('switches tabs on horizontal swipe', async () => {
        const wrapper = mount(SettingsModal);
        const content = wrapper.find('.flex-1.overflow-y-auto');
        
        // Initial tab: gen (index 0)
        expect(wrapper.vm.tab).toBe('gen');

        // Swipe Left (Next tab -> cat)
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 100 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 100, clientY: 100 }]
        });
        expect(wrapper.vm.tab).toBe('cat');

        // Swipe Left again (Next tab -> sub)
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 100 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 100, clientY: 100 }]
        });
        expect(wrapper.vm.tab).toBe('sub');
    });

    it('does not switch tabs on vertical swipe', async () => {
        const wrapper = mount(SettingsModal);
        const content = wrapper.find('.flex-1.overflow-y-auto');
        
        // Vertical swipe
        await content.trigger('touchstart', {
            touches: [{ clientX: 200, clientY: 300 }]
        });
        await content.trigger('touchend', {
            changedTouches: [{ clientX: 200, clientY: 100 }]
        });
        expect(wrapper.vm.tab).toBe('gen');
    });

    it('syncs weights correctly when one is changed', async () => {
        const wrapper = mount(SettingsModal);
        
        // Access component's reactive state for testing logic
        // (Wait for onMounted)
        await new Promise(r => setTimeout(r, 10));
        
        const vm = wrapper.vm;
        // chor: 13, prog: 87
        
        // Change chor to 50
        vm.syncWeights('chor', 50);
        
        expect(vm.editableCats['chor'].weight).toBe(50);
        expect(vm.editableCats['prog'].weight).toBe(50);
    });

    it('displays the correct application version', () => {
        const wrapper = mount(SettingsModal);
        expect(wrapper.text()).toContain('v2.0.9');
    });
});
