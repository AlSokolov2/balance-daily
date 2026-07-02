import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { mount } from '@vue/test-utils';
import ToastNotification from '../../../resources/js/components/ToastNotification.vue';
import { useToast } from '../../../resources/js/composables/useToast';

describe('ToastNotification Component', () => {
    let toast;

    beforeEach(() => {
        vi.useFakeTimers();
        toast = useToast();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('renders nothing when not visible', () => {
        const wrapper = mount(ToastNotification);
        expect(wrapper.text()).toBe('');
    });

    it('renders toast message when visible', () => {
        toast.show('Сохранено');
        const wrapper = mount(ToastNotification);

        expect(wrapper.text()).toContain('Сохранено');
    });

    it('hides after duration expires', async () => {
        toast.show('Test');
        const wrapper = mount(ToastNotification);

        expect(wrapper.text()).toContain('Test');

        vi.advanceTimersByTime(2000);
        await wrapper.vm.$nextTick();

        expect(wrapper.text()).toBe('');
    });

    it('renders green checkmark icon', () => {
        toast.show('OK');
        const wrapper = mount(ToastNotification);

        const svg = wrapper.find('svg');
        expect(svg.exists()).toBe(true);
        expect(svg.find('path').exists()).toBe(true);
    });
});
