import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseInput from '../../../resources/js/components/BaseInput.vue';

describe('BaseInput', () => {
    it('renders an input element', () => {
        const wrapper = mount(BaseInput);
        expect(wrapper.find('input').exists()).toBe(true);
    });

    it('binds modelValue', () => {
        const wrapper = mount(BaseInput, { props: { modelValue: 'hello' } });
        expect(wrapper.find('input').element.value).toBe('hello');
    });

    it('emits update:modelValue on input', async () => {
        const wrapper = mount(BaseInput);
        await wrapper.find('input').setValue('test');
        expect(wrapper.emitted('update:modelValue')[0]).toEqual(['test']);
    });

    it('shows error message when error prop is set', () => {
        const wrapper = mount(BaseInput, { props: { error: 'Required field' } });
        expect(wrapper.text()).toContain('Required field');
    });

    it('does not show error message when no error', () => {
        const wrapper = mount(BaseInput);
        expect(wrapper.find('p').exists()).toBe(false);
    });

    it('sets placeholder attribute', () => {
        const wrapper = mount(BaseInput, { props: { placeholder: 'Enter text' } });
        expect(wrapper.find('input').attributes('placeholder')).toBe('Enter text');
    });

    it('disables input when disabled prop is true', () => {
        const wrapper = mount(BaseInput, { props: { disabled: true } });
        expect(wrapper.find('input').element.disabled).toBe(true);
    });

    it('renders prepend slot', () => {
        const wrapper = mount(BaseInput, { slots: { prepend: '<span class="pre">@</span>' } });
        expect(wrapper.find('.pre').exists()).toBe(true);
    });

    it('renders append slot', () => {
        const wrapper = mount(BaseInput, { slots: { append: '<span class="app">.com</span>' } });
        expect(wrapper.find('.app').exists()).toBe(true);
    });
});
