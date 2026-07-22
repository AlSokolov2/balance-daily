/**
 * SettingsView — accounts tab tests.
 * Verifies fix for double /api/ prefix in linkGoogle (was causing 405/502).
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import axios from 'axios';

vi.mock('axios');

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (k) => k,
        tm: () => [],
        locale: { value: 'ru' },
    }),
}));

vi.mock('../../../resources/js/plugins/vizPluginRegistry.js', () => ({
    listPlugins: () => [],
}));

vi.mock('vue-router', () => ({
    useRouter: () => ({ push: vi.fn() }),
    useRoute: () => ({ name: 'settings', path: '/settings' }),
}));

// Minimal stub for BaseButton — renders a native button with slot content
const BaseButtonStub = {
    name: 'BaseButton',
    props: {
        variant: { type: String, default: 'primary' },
        size: { type: String, default: 'md' },
        icon: { type: String, default: '' },
        disabled: { type: Boolean, default: false },
        loading: { type: Boolean, default: false },
    },
    emits: ['click'],
    template: '<button class="base-btn-stub" @click="$emit(\'click\')"><slot /></button>',
};

const AppIconStub = { template: '<span />' };

describe('SettingsView — Accounts tab', () => {
    let wrapper;

    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        localStorage.clear();
        delete axios.defaults.headers.common['Authorization'];
        window.apiBaseUrl = 'https://balance.example.com';
    });

    afterEach(() => {
        if (wrapper) wrapper.unmount();
    });

    async function mountSettings(userProviders = []) {
        const store = useBalanceStore();
        Object.defineProperty(store, 'user', {
            get: () => ({
                id: 1,
                name: 'Test',
                email: 'test@vk.com',
                providers: userProviders,
            }),
            configurable: true,
        });

        const { default: SettingsView } = await import('../../../resources/js/views/SettingsView.vue');

        wrapper = mount(SettingsView, {
            global: {
                stubs: {
                    AppIcon: AppIconStub,
                    BaseButton: BaseButtonStub,
                    RouterLink: { template: '<a><slot /></a>' },
                },
            },
        });

        return wrapper;
    }

    /** Click the tab button whose label contains the given text. */
    async function switchToTab(labelKey) {
        const allBtns = wrapper.findAll('button');
        for (const btn of allBtns) {
            if (btn.text().includes(labelKey)) {
                await btn.trigger('click');
                await wrapper.vm.$nextTick();
                return;
            }
        }
    }

    describe('hasGoogleLinked computed', () => {
        it('shows "Link Google" when Google is not linked', async () => {
            await mountSettings([{ provider: 'vkid', email: 'user@vk.com' }]);
            await switchToTab('settings.tabs.accounts');

            expect(wrapper.text()).toContain('settings.accounts.link_google');
            expect(wrapper.text()).toContain('vkid');
            expect(wrapper.text()).toContain('settings.accounts.connected');
        });

        it('hides "Link Google" when Google is already linked', async () => {
            await mountSettings([
                { provider: 'vkid', email: 'user@vk.com' },
                { provider: 'google', email: 'user@gmail.com' },
            ]);
            await switchToTab('settings.tabs.accounts');

            expect(wrapper.text()).not.toContain('settings.accounts.link_google');
            expect(wrapper.text()).toContain('google');
        });
    });

    describe('linkGoogle API call', () => {
        it('uses relative URL — no double /api/ prefix (regression #405/#502)', async () => {
            axios.defaults.baseURL = window.apiBaseUrl + '/api/';
            axios.post.mockResolvedValueOnce({
                data: { url: '/auth/google/link?token=abc123' },
            });

            await mountSettings([{ provider: 'vkid', email: 'user@vk.com' }]);
            await switchToTab('settings.tabs.accounts');

            // Find the correct button: there are 2 BaseButton stubs on the
            // accounts tab (back button + link button). Pick by text.
            const allBaseBtns = wrapper.findAll('.base-btn-stub');
            const linkBtn = allBaseBtns.find(b => b.text().includes('settings.accounts.link_google'));
            expect(linkBtn).toBeTruthy();

            await linkBtn.trigger('click');
            await wrapper.vm.$nextTick();

            expect(axios.post).toHaveBeenCalledTimes(1);
            const urlArg = axios.post.mock.calls[0][0];
            expect(urlArg).toBe('auth/link-token');
            expect(urlArg).not.toContain('/api/');
        });

        it('shows alert and logs error on failure', async () => {
            axios.defaults.baseURL = window.apiBaseUrl + '/api/';

            const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
            const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

            axios.post.mockRejectedValueOnce(new Error('Network error'));

            await mountSettings([{ provider: 'vkid', email: 'user@vk.com' }]);
            await switchToTab('settings.tabs.accounts');

            const allBaseBtns = wrapper.findAll('.base-btn-stub');
            const linkBtn = allBaseBtns.find(b => b.text().includes('settings.accounts.link_google'));
            expect(linkBtn).toBeTruthy();
            await linkBtn.trigger('click');
            await wrapper.vm.$nextTick();
            // Let the rejected promise propagate in the catch handler
            await new Promise(r => setTimeout(r, 50));

            expect(consoleSpy).toHaveBeenCalledWith('Link Google error:', expect.any(Error));
            expect(alertSpy).toHaveBeenCalledWith('settings.accounts.link_error');

            consoleSpy.mockRestore();
            alertSpy.mockRestore();
        });
    });
});
