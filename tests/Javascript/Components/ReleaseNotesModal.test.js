import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ReleaseNotesModal from '../../../resources/js/components/ReleaseNotesModal.vue';
import { useReleaseNotesStore } from '../../../resources/js/stores/releaseNotes';

const BaseModalStub = {
    name: 'BaseModal',
    props: ['visible', 'title', 'maxWidth', 'closeOnBackdrop'],
    emits: ['close'],
    template: '<div v-if="visible" class="modal-stub"><h2>{{ title }}</h2><slot /><slot name="footer" /></div>',
};

const BaseButtonStub = {
    name: 'BaseButton',
    props: ['variant', 'size', 'icon', 'disabled', 'loading', 'class'],
    emits: ['click'],
    template: '<button class="btn-stub" @click="$emit(\'click\')"><slot /></button>',
};

function mountModal() {
    return mount(ReleaseNotesModal, {
        global: {
            stubs: {
                BaseModal: BaseModalStub,
                BaseButton: BaseButtonStub,
            },
        },
    });
}

describe('ReleaseNotesModal (#211)', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();

        store = useReleaseNotesStore();
        store.currentVersion = '2.19.0';
        store.lastSeen = '2.18.0';
        store.notes = [
            { version: '2.18.0', date: '2026-10-05', items: [] },
            { version: '2.19.0', date: '2026-10-18', items: [] },
            { version: '2.20.0', date: '2026-11-01', items: [] },
        ];
        store.visible = true;
        store.mode = 'update';
    });

    it('renders the version, date and localized note', () => {
        store.notes = [{
            version: '2.19.0',
            date: '2026-10-18',
            items: [{ type: 'fix', ru: 'Исправлено что-то', en: 'Fixed something' }],
        }];

        const wrapper = mountModal();

        expect(wrapper.text()).toContain('v2.19.0');
        expect(wrapper.text()).toContain('18.10.2026');
        expect(wrapper.text()).toContain('Исправлено что-то');
        expect(wrapper.text()).toContain('release_notes.types.fix');
        expect(wrapper.text()).toContain('release_notes.got_it');
    });

    it('shows only unseen versions in update mode, newest first', () => {
        const wrapper = mountModal();
        const text = wrapper.text();

        expect(text).toContain('v2.19.0');
        expect(text).not.toContain('v2.18.0');
        expect(text).not.toContain('v2.20.0');
    });

    it('shows the whole history in history mode, newest first', () => {
        store.openHistory();

        const wrapper = mountModal();
        const text = wrapper.text();

        expect(text.indexOf('v2.20.0')).toBeLessThan(text.indexOf('v2.19.0'));
        expect(text.indexOf('v2.19.0')).toBeLessThan(text.indexOf('v2.18.0'));
    });

    it('falls back to English and keeps an unparsable date as is', () => {
        store.notes = [{
            version: '2.19.0',
            date: 'not-a-date',
            items: [{ type: 'feature', en: 'Only English' }],
        }];

        const wrapper = mountModal();

        expect(wrapper.text()).toContain('not-a-date');
        expect(wrapper.text()).toContain('Only English');
        expect(wrapper.text()).toContain('release_notes.types.feature');
    });

    it('renders an empty state', () => {
        store.notes = [];
        store.openHistory();

        const wrapper = mountModal();

        expect(wrapper.text()).toContain('release_notes.empty');
    });

    it('dismisses from the footer button', async () => {
        const wrapper = mountModal();

        await wrapper.find('.btn-stub').trigger('click');

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
    });
});
