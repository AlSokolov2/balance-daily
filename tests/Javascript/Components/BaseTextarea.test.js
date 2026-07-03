import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseTextarea from '../../../resources/js/components/BaseTextarea.vue';

describe('BaseTextarea', () => {
    it('renders a textarea element', () => {
        const wrapper = mount(BaseTextarea);
        expect(wrapper.find('textarea').exists()).toBe(true);
    });

    it('binds modelValue', () => {
        const wrapper = mount(BaseTextarea, { props: { modelValue: 'hello' } });
        expect(wrapper.find('textarea').element.value).toBe('hello');
    });

    it('emits update:modelValue on input', async () => {
        const wrapper = mount(BaseTextarea);
        await wrapper.find('textarea').setValue('test');
        expect(wrapper.emitted('update:modelValue')[0]).toEqual(['test']);
    });

    it('shows error message', () => {
        const wrapper = mount(BaseTextarea, { props: { error: 'Too long' } });
        expect(wrapper.text()).toContain('Too long');
    });

    it('respects rows prop', () => {
        const wrapper = mount(BaseTextarea, { props: { rows: 5 } });
        expect(wrapper.find('textarea').attributes('rows')).toBe('5');
    });

    it('defaults to 3 rows', () => {
        const wrapper = mount(BaseTextarea);
        expect(wrapper.find('textarea').attributes('rows')).toBe('3');
    });

    it('disables textarea when disabled', () => {
        const wrapper = mount(BaseTextarea, { props: { disabled: true } });
        expect(wrapper.find('textarea').element.disabled).toBe(true);
    });
});
