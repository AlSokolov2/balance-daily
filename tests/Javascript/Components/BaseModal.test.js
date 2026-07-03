import { describe, it, expect } from 'vitest';
import { mount } from '@vue/test-utils';
import BaseModal from '../../../resources/js/components/BaseModal.vue';

/**
 * Stub Teleport (jsdom limitation) and AppIcon (to avoid icon registry dependency).
 */
const stubs = {
    Teleport: { template: '<div><slot /></div>' },
    AppIcon: { template: '<span class="icon-mock" />' },
};

describe('BaseModal', () => {
    it('does not render when visible is false', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            slots: { default: 'Content' },
        });
        expect(wrapper.html()).not.toContain('Content');
    });

    it('renders when visible is true', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true },
            slots: { default: '<p>Modal body</p>' },
        });
        expect(wrapper.html()).toContain('Modal body');
    });

    it('renders title when provided', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true, title: 'Test Modal' },
        });
        expect(wrapper.html()).toContain('Test Modal');
    });

    it('renders header slot instead of title when provided', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true, title: 'Should not show' },
            slots: { header: '<h1>Custom Header</h1>' },
        });
        expect(wrapper.html()).toContain('Custom Header');
        expect(wrapper.html()).not.toContain('Should not show');
    });

    it('renders footer slot', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true },
            slots: { footer: '<button>Save</button>', default: 'Body' },
        });
        expect(wrapper.html()).toContain('Save');
    });

    it('emits close when X button clicked', async () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true, title: 'Test' },
        });
        await wrapper.find('button').trigger('click');
        expect(wrapper.emitted('close')).toBeTruthy();
    });

    it('renders backdrop element when visible', () => {
        const wrapper = mount(BaseModal, {
            global: { stubs },
            props: { visible: true, closeOnBackdrop: true },
        });
        expect(wrapper.find('.fixed').exists()).toBe(true);
    });
});
