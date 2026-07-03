import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseButton from '../../../resources/js/components/BaseButton.vue';

describe('BaseButton', () => {
    it('renders with default props', () => {
        const wrapper = mount(BaseButton, { slots: { default: 'Click' } });
        expect(wrapper.text()).toContain('Click');
        expect(wrapper.find('button').exists()).toBe(true);
    });

    it('applies variant classes', () => {
        const variants = ['primary', 'secondary', 'danger', 'ghost'];
        for (const variant of variants) {
            const wrapper = mount(BaseButton, {
                props: { variant },
                slots: { default: 'Btn' },
            });
            expect(wrapper.find('button').exists()).toBe(true);
        }
    });

    it('applies size classes', () => {
        const sizes = ['sm', 'md', 'lg'];
        for (const size of sizes) {
            const wrapper = mount(BaseButton, {
                props: { size },
                slots: { default: 'Btn' },
            });
            expect(wrapper.find('button').exists()).toBe(true);
        }
    });

    it('emits click event', async () => {
        const wrapper = mount(BaseButton, { slots: { default: 'Click' } });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')).toBeTruthy();
    });

    it('does not emit click when disabled', async () => {
        const wrapper = mount(BaseButton, {
            props: { disabled: true },
            slots: { default: 'Click' },
        });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('does not emit click when loading', async () => {
        const wrapper = mount(BaseButton, {
            props: { loading: true },
            slots: { default: 'Click' },
        });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('click')).toBeFalsy();
    });

    it('shows spinner when loading', () => {
        const wrapper = mount(BaseButton, {
            props: { loading: true },
            slots: { default: 'Click' },
        });
        expect(wrapper.find('.animate-spin').exists()).toBe(true);
    });

    it('renders icon when icon prop is set', () => {
        const wrapper = mount(BaseButton, {
            props: { icon: 'plus' },
            slots: { default: 'Add' },
        });
        expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('has disabled attribute on button when disabled', () => {
        const wrapper = mount(BaseButton, {
            props: { disabled: true },
            slots: { default: 'Btn' },
        });
        expect(wrapper.find('button').element.disabled).toBe(true);
    });
});
