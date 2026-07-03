import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseCard from '../../../resources/js/components/BaseCard.vue';

describe('BaseCard', () => {
    it('renders default slot content', () => {
        const wrapper = mount(BaseCard, { slots: { default: '<p>Hello</p>' } });
        expect(wrapper.html()).toContain('Hello');
    });

    it('renders header slot', () => {
        const wrapper = mount(BaseCard, { slots: { header: '<h3>Title</h3>', default: 'Body' } });
        expect(wrapper.html()).toContain('Title');
    });

    it('renders footer slot', () => {
        const wrapper = mount(BaseCard, { slots: { footer: '<button>OK</button>', default: 'Body' } });
        expect(wrapper.html()).toContain('OK');
    });

    it('does not render header div when no header slot', () => {
        const wrapper = mount(BaseCard, { slots: { default: 'Body' } });
        // header should not be in the DOM
        expect(wrapper.find('.border-b').exists()).toBe(false);
    });

    it('applies padding variants', () => {
        const wrapper = mount(BaseCard, { props: { padding: 'lg' }, slots: { default: 'Body' } });
        expect(wrapper.find('div').classes()).toContain('p-6');
    });

    it('applies none padding', () => {
        const wrapper = mount(BaseCard, { props: { padding: 'none' }, slots: { default: 'Body' } });
        const root = wrapper.find('div');
        expect(root.classes()).not.toContain('p-3');
        expect(root.classes()).not.toContain('p-5');
        expect(root.classes()).not.toContain('p-6');
    });

    it('applies radius variants', () => {
        const wrapper = mount(BaseCard, { props: { radius: 'lg' }, slots: { default: 'Body' } });
        expect(wrapper.find('div').classes()).toContain('rounded-lg');
    });
});
