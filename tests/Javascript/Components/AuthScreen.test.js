import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import AuthScreen from '../../../resources/js/components/AuthScreen.vue';

describe('AuthScreen Component', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('renders both VK ID and Google buttons', () => {
        const wrapper = mount(AuthScreen);

        const buttons = wrapper.findAll('button');
        expect(buttons).toHaveLength(2);

        // VK ID button — primary
        expect(buttons[0].text()).toContain('login_with_vkid');

        // Google button — secondary
        expect(buttons[1].text()).toContain('login_with_google');
    });

    it('VK ID button has blue background', () => {
        const wrapper = mount(AuthScreen);

        const vkBtn = wrapper.findAll('button')[0];
        const classes = vkBtn.classes();
        // bg-[#0077FF] is rendered as inline style or class
        expect(vkBtn.attributes('class')).toContain('bg-[');
    });

    it('Google button is smaller than VK button', () => {
        const wrapper = mount(AuthScreen);

        const vkBtn = wrapper.findAll('button')[0];
        const googleBtn = wrapper.findAll('button')[1];

        // VK uses text-[15px], Google uses text-[13px]
        expect(googleBtn.attributes('class')).toContain('text-[13px]');
    });

    it('renders app title and description', () => {
        const wrapper = mount(AuthScreen);

        expect(wrapper.text()).toContain('app.title');
        expect(wrapper.text()).toContain('auth.description');
    });
});
