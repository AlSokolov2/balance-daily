import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import ListSortBar from '../../../resources/js/components/ListSortBar.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';

// The setup file mocks `$t` as identity, so buttons carry their i18n keys as labels.
const buttons = (wrapper) => wrapper.findAll('button');
const labels = (wrapper) => buttons(wrapper).map(b => b.text());

describe('ListSortBar (#155)', () => {
    let store;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        useTasksStore().tasks = [];
    });

    it('offers nothing while the list is neither the archive nor the hidden one', async () => {
        const wrapper = mount(ListSortBar);
        expect(wrapper.find('button').exists()).toBe(false);

        store.filterCat = 'work';
        await wrapper.vm.$nextTick();
        expect(wrapper.find('button').exists()).toBe(false);
    });

    it('offers the archive fields in the archive', async () => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        expect(labels(wrapper)).toEqual([
            'app.sort.completed_desc',
            'app.sort.created_desc',
            'app.sort.name_asc',
        ]);
    });

    it('offers the hidden fields in the hidden list', async () => {
        store.filterCat = 'hidden';
        const wrapper = mount(ListSortBar);
        expect(labels(wrapper)).toEqual([
            'app.sort.appears_asc',
            'app.sort.created_desc',
            'app.sort.name_asc',
        ]);
    });

    it.each([
        ['app.sort.completed_desc', 'completed_desc'],
        ['app.sort.created_desc', 'created_desc'],
        ['app.sort.name_asc', 'name_asc'],
    ])('clicking %s sets the archive sort', async (label, key) => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        await buttons(wrapper).find(b => b.text() === label).trigger('click');
        expect(store.archiveSort).toBe(key);
    });

    it('writes to the hidden key, not the archive one, in the hidden list', async () => {
        store.filterCat = 'hidden';
        const wrapper = mount(ListSortBar);
        await buttons(wrapper).find(b => b.text() === 'app.sort.name_asc').trigger('click');
        expect(store.hiddenSort).toBe('name_asc');
        expect(store.archiveSort).toBe('completed_desc');
    });

    it('marks the active option for assistive tech', async () => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        expect(buttons(wrapper).map(b => b.attributes('aria-pressed'))).toEqual(['true', 'false', 'false']);

        store.archiveSort = 'name_asc';
        await wrapper.vm.$nextTick();
        expect(buttons(wrapper).map(b => b.attributes('aria-pressed'))).toEqual(['false', 'false', 'true']);
    });

    it('swaps the offered fields when the section changes', async () => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        expect(buttons(wrapper)).toHaveLength(3);

        store.filterCat = 'hidden';
        await wrapper.vm.$nextTick();
        expect(labels(wrapper)).toContain('app.sort.appears_asc');
    });

    it('exposes a label so the choice is not as unexplained as the old order', () => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        expect(wrapper.text()).toContain('app.sort.label');
    });

    it('uses real buttons so the control is reachable by keyboard', () => {
        store.filterCat = 'archive';
        const wrapper = mount(ListSortBar);
        expect(buttons(wrapper).every(b => b.attributes('type') === 'button')).toBe(true);
    });
});
