import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AuthScreen from '../../../resources/js/components/AuthScreen.vue';

describe('AuthScreen Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders VK ID button as the only login option', () => {
        const wrapper = mount(AuthScreen);

        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(1);

        expect(buttons[0].text()).toContain('login_with_vkid');
    });

    it('VK ID button has blue background', () => {
        const wrapper = mount(AuthScreen);

        const vkBtn = wrapper.find('button');
        expect(vkBtn.attributes('class')).toContain('bg-[#0077FF]');
    });

    it('renders app title and description', () => {
        const wrapper = mount(AuthScreen);

        expect(wrapper.text()).toContain('app.title');
        expect(wrapper.text()).toContain('auth.description');
    });
});
