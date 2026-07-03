import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AppHeader from '../../../resources/js/components/AppHeader.vue';
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
});
