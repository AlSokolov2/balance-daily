import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import ConfirmDialog from '../../../resources/js/components/ConfirmDialog.vue';

const stubs = {
    Teleport: { template: '<div><slot /></div>' },
    AppIcon: { template: '<span class="icon-mock" />' },
};

describe('ConfirmDialog', () => {
    it('does not render when not visible', () => {
        const wrapper = mount(ConfirmDialog, { global: { stubs } });
        expect(wrapper.html()).not.toContain('Are you sure?');
    });

    it('renders when visible', () => {
        const wrapper = mount(ConfirmDialog, {
            global: { stubs },
            props: { visible: true },
        });
        expect(wrapper.html()).toContain('Are you sure?');
    });

    it('renders custom message', () => {
        const wrapper = mount(ConfirmDialog, {
            global: { stubs },
            props: { visible: true, message: 'Delete this task?' },
        });
        expect(wrapper.html()).toContain('Delete this task?');
    });

    it('renders custom button labels', () => {
        const wrapper = mount(ConfirmDialog, {
            global: { stubs },
            props: { visible: true, confirmText: 'Yes', cancelText: 'No' },
        });
        expect(wrapper.html()).toContain('Yes');
        expect(wrapper.html()).toContain('No');
    });

    it('emits confirm when confirm button clicked', async () => {
        const wrapper = mount(ConfirmDialog, {
            global: { stubs },
            props: { visible: true },
        });
        // Confirm button is the danger variant (last BaseButton)
        const buttons = wrapper.findAllComponents({ name: 'BaseButton' });
        const confirmBtn = buttons.find(b => b.props('variant') === 'danger');
        await confirmBtn.trigger('click');
        expect(wrapper.emitted('confirm')).toBeTruthy();
    });

    it('emits cancel when cancel button clicked', async () => {
        const wrapper = mount(ConfirmDialog, {
            global: { stubs },
            props: { visible: true },
        });
        const buttons = wrapper.findAllComponents({ name: 'BaseButton' });
        const cancelBtn = buttons.find(b => b.props('variant') === 'ghost');
        await cancelBtn.trigger('click');
        expect(wrapper.emitted('cancel')).toBeTruthy();
    });
});
