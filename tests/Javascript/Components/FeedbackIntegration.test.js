import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AppHeader from '../../../resources/js/components/AppHeader.vue';
import SettingsModal from '../../../resources/js/components/SettingsModal.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';

describe('Feedback System UI Verification', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        const store = useBalanceStore();
        store.user = { name: 'Test User', avatar: 'https://example.com/avatar.jpg' };
        store.categories = [
            { slug: 'work', name: 'Work', weight: 0.5, color: '#ff0000' },
            { slug: '__archive__', name: 'Archive', weight: 0.01, color: '#8e8e93' }
        ];

        // Mock matchMedia for SettingsModal
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

    it('displays the feedback link in the AppHeader user menu', async () => {
        const wrapper = mount(AppHeader, {
            props: {
                isMenuOpen: true
            }
        });

        const feedbackLink = wrapper.find('a[href*="issues/new"]');
        expect(feedbackLink.exists()).toBe(true);
        expect(feedbackLink.text()).toContain('app.feedback');
    });

    it('displays bug report and feature request links in SettingsModal Data tab', async () => {
        const wrapper = mount(SettingsModal);
        
        // Switch to Data tab
        const buttons = wrapper.findAll('button');
        const dataTab = buttons.find(b => b.text().includes('settings.tabs.data'));
        await dataTab.trigger('click');

        // Check for bug report link
        const bugLink = wrapper.find('a[href*="bug-report.yml"]');
        expect(bugLink.exists()).toBe(true);
        expect(bugLink.text()).toContain('settings_modal.data.bug_report');

        // Check for feature request link
        const featureLink = wrapper.find('a[href*="feature-request.yml"]');
        expect(featureLink.exists()).toBe(true);
        expect(featureLink.text()).toContain('settings_modal.data.suggest_feature');
    });
});
