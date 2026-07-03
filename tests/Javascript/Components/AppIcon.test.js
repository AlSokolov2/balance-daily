import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import AppIcon from '../../../resources/js/components/AppIcon.vue';

describe('AppIcon', () => {
    it('renders an SVG element', () => {
        const wrapper = mount(AppIcon, { props: { name: 'close' } });
        expect(wrapper.find('svg').exists()).toBe(true);
    });

    it('renders all registered icon names without errors', () => {
        const names = [
            'home', 'stats', 'notepad', 'plus', 'close', 'search', 'edit',
            'trash', 'check', 'settings', 'chevron-left', 'chevron-right',
            'chevron-down', 'logout', 'comment', 'sync', 'danger', 'lightbulb',
            'download', 'upload', 'box', 'database', 'check-circle',
            'vk', 'google', 'balance', 'clipboard',
        ];
        for (const name of names) {
            const wrapper = mount(AppIcon, { props: { name } });
            expect(wrapper.find('svg').exists(), `Icon "${name}" should render`).toBe(true);
        }
    });

    it('applies correct size classes for predefined sizes', () => {
        const cases = { sm: 16, md: 20, lg: 24 };
        for (const [size, expected] of Object.entries(cases)) {
            const wrapper = mount(AppIcon, { props: { name: 'plus', size } });
            const svg = wrapper.find('svg');
            expect(svg.attributes('width')).toBe(String(expected));
            expect(svg.attributes('height')).toBe(String(expected));
        }
    });

    it('accepts numeric size', () => {
        const wrapper = mount(AppIcon, { props: { name: 'plus', size: 32 } });
        expect(wrapper.find('svg').attributes('width')).toBe('32');
    });

    it('uses defaultStroke from registry when no strokeWidth prop given', () => {
        // 'close' has defaultStroke: 2
        const wrapper = mount(AppIcon, { props: { name: 'close' } });
        expect(wrapper.find('svg').attributes('stroke-width')).toBe('2');
    });

    it('overrides strokeWidth when prop is given', () => {
        const wrapper = mount(AppIcon, { props: { name: 'close', strokeWidth: 3 } });
        expect(wrapper.find('svg').attributes('stroke-width')).toBe('3');
    });

    it('renders filled icons without stroke', () => {
        const wrapper = mount(AppIcon, { props: { name: 'vk' } });
        const svg = wrapper.find('svg');
        expect(svg.attributes('fill')).toBe('currentColor');
        expect(svg.attributes('stroke')).toBe('none');
    });

    it('renders google logo with colored paths', () => {
        const wrapper = mount(AppIcon, { props: { name: 'google' } });
        const paths = wrapper.findAll('path');
        expect(paths.length).toBe(4);
        expect(paths[0].attributes('fill')).toBe('#4285F4');
    });
});
