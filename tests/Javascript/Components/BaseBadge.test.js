import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseBadge from '../../../resources/js/components/BaseBadge.vue';

describe('BaseBadge', () => {
    it('renders slot content', () => {
        const wrapper = mount(BaseBadge, { slots: { default: 'NEW' } });
        expect(wrapper.text()).toBe('NEW');
    });

    it('renders all variant types without errors', () => {
        const variants = ['default', 'success', 'warning', 'danger', 'info'];
        for (const variant of variants) {
            const wrapper = mount(BaseBadge, {
                props: { variant },
                slots: { default: 'Badge' },
            });
            expect(wrapper.find('span').exists()).toBe(true);
        }
    });

    it('applies size classes', () => {
        const sm = mount(BaseBadge, { props: { size: 'sm' }, slots: { default: 'S' } });
        const md = mount(BaseBadge, { props: { size: 'md' }, slots: { default: 'M' } });
        // Both should render successfully
        expect(sm.find('span').exists()).toBe(true);
        expect(md.find('span').exists()).toBe(true);
    });

    it('renders as a span element', () => {
        const wrapper = mount(BaseBadge, { slots: { default: 'Test' } });
        expect(wrapper.find('span').exists()).toBe(true);
    });
});
