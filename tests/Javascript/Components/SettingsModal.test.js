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
        
        // Default tab is 'gen' (Общие)
        expect(wrapper.text()).toContain('Оформление системы');

        // Click 'Категории' tab
        const tabs = wrapper.findAll('.cursor-pointer');
        const catTab = tabs.find(t => t.text() === 'Категории');
        await catTab.trigger('click');
        
        expect(wrapper.text()).toContain('Добавить');

        // Click 'Подкатегории' tab
        const subcatTab = tabs.find(t => t.text() === 'Подкатегории');
        await subcatTab.trigger('click');

        expect(wrapper.text()).toContain('Подкатегории');
        expect(wrapper.text()).not.toContain('+ Добавить');
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
