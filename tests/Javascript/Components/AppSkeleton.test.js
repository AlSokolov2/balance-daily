import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppSkeleton from '../../../resources/js/components/AppSkeleton.vue';

describe('AppSkeleton', () => {
    it('renders with default text variant', () => {
        const wrapper = mount(AppSkeleton);
        const el = wrapper.find('[role="status"]');
        expect(el.exists()).toBe(true);
        expect(el.attributes('aria-label')).toBe('Loading');
    });

    it('renders all variant types', () => {
        const variants = ['text', 'circle', 'rect', 'card'];
        for (const variant of variants) {
            const wrapper = mount(AppSkeleton, { props: { variant } });
            expect(wrapper.find('[role="status"]').exists()).toBe(true);
        }
    });

    it('renders multiple items when count > 1', () => {
        const wrapper = mount(AppSkeleton, { props: { count: 3 } });
        const items = wrapper.findAll('[role="status"] > *');
        expect(items.length).toBe(3);
    });

    it('renders single item without wrapper when count is 1', () => {
        const wrapper = mount(AppSkeleton, { props: { count: 1 } });
        // Single element, no wrapper div
        expect(wrapper.findAll('[role="status"]').length).toBe(1);
    });

    it('applies custom width and height', () => {
        const wrapper = mount(AppSkeleton, {
            props: { variant: 'rect', width: '200px', height: '100px' },
        });
        const el = wrapper.find('[role="status"]');
        expect(el.attributes('style')).toContain('width: 200px');
        expect(el.attributes('style')).toContain('height: 100px');
    });

    it('applies pulse animation class', () => {
        const wrapper = mount(AppSkeleton);
        expect(wrapper.find('[role="status"]').classes()).toContain('animate-pulse');
    });

    it('circle variant is round', () => {
        const wrapper = mount(AppSkeleton, { props: { variant: 'circle' } });
        expect(wrapper.find('[role="status"]').classes()).toContain('rounded-full');
    });
});
