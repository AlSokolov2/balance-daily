import { describe, it, expect, beforeEach } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import FilterBar from '../../../resources/js/components/FilterBar.vue';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { useTasksStore } from '../../../resources/js/stores/tasks';

/**
 * The bar is the only way into the archive and the hidden list, on both layouts (#151),
 * so it is worth pinning: the chips it renders and where each one points `filterCat`.
 */
describe('FilterBar Component', () => {
    let store;
    let chips;

    beforeEach(() => {
        setActivePinia(createPinia());
        store = useBalanceStore();
        useTasksStore().categories = [
            { slug: 'work', name: 'Work', weight: 0.3 },
            { slug: '__archive__', name: 'Pseudo', weight: 0.1 },
        ];
        useTasksStore().tasks = [
            { id: 1, category_slug: 'work', completed: false },
            { id: 2, category_slug: 'work', completed: true, completed_at: new Date().toISOString() },
            { id: 3, category_slug: 'work', completed: false, hidden_until: new Date(Date.now() + 86400000).toISOString() },
        ];
        chips = mount(FilterBar).findAll('.filter-scroll > div');
    });

    /** @param {string} key i18n key the chip is labelled with */
    const chipFor = (key) => chips.find(c => c.text().startsWith(key));

    it('renders the three fixed groups with their counts', () => {
        expect(chipFor('app.filter.all').text()).toBe('app.filter.all (1)');
        expect(chipFor('app.filter.archive').text()).toBe('app.filter.archive (1)');
        expect(chipFor('app.filter.hidden').text()).toBe('app.filter.hidden (1)');
    });

    it('lists real categories but not the archive pseudo-category', () => {
        const names = chips.map(c => c.text());
        expect(names).toContain('Work (1)');
        expect(names.some(n => n.startsWith('Pseudo'))).toBe(false);
    });

    it.each([
        ['app.filter.archive', 'archive'],
        ['app.filter.hidden', 'hidden'],
        ['app.filter.all', 'all'],
    ])('points filterCat at %s when the chip is clicked', async (key, expected) => {
        await chipFor(key).trigger('click');
        expect(store.filterCat).toBe(expected);
    });

    it('points filterCat at the category slug', async () => {
        await chipFor('Work').trigger('click');
        expect(store.filterCat).toBe('work');
    });
});
