/**
 * EditCategoryView component tests.
 * Verifies fix for #137: removed import/export endpoint regression,
 * weight normalization, and delete via individual API calls.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { mount } from '@vue/test-utils';
import { createPinia, setActivePinia } from 'pinia';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import axios from 'axios';

vi.mock('axios');

vi.mock('vue-i18n', () => ({
    useI18n: () => ({ t: (k) => k, tm: () => [], locale: { value: 'ru' } }),
}));

const mockPush = vi.fn();
const mockRoute = { params: { slug: 'chor' } };
vi.mock('vue-router', () => ({
    useRouter: () => ({ push: mockPush }),
    useRoute: () => mockRoute,
}));

// We test through the EditCategoryView which wraps EditCategoryModal.
// Simpler approach: test the handleSave/handleDelete logic directly
// by mounting the parent and mocking the child.

describe('EditCategoryView', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        vi.clearAllMocks();
        const store = useTasksStore();
        store.categories = [
            { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30', hide_until: null },
            { id: 2, slug: 'prog', name: 'PROG', weight: 0.46, color: '#34c759', hide_until: null },
            { id: 3, slug: '__archive__', name: 'Archive', weight: 0.01, color: '#8e8e93', hide_until: null },
        ];
    });

    it('handleSave sends weight as decimal (divided by 100) for existing category', async () => {
        mockRoute.params = { slug: 'chor' };
        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        mounted() {
                            // Simulate user clicking save with weight = 25 (as percentage)
                            this.$emit('save', 'chor', {
                                name: 'CHOR',
                                weight: 25,
                                color: '#ff3b30',
                                hide_until: '',
                            });
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();
        await new Promise(r => setTimeout(r, 20));

        expect(axios.put).toHaveBeenCalledWith('categories/1', {
            name: 'CHOR',
            weight: 0.25,  // 25 / 100 = 0.25
            color: '#ff3b30',
            hide_until: null,  // '' → null
        });
        expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('handleSave sends POST for new category with slug', async () => {
        mockRoute.params = { slug: 'cat_new_12345' };
        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        mounted() {
                            this.$emit('save', 'cat_new_12345', {
                                name: 'NewCat',
                                weight: 50,
                                color: '#000000',
                                hide_until: '23:59',
                            });
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();
        await new Promise(r => setTimeout(r, 20));

        expect(axios.post).toHaveBeenCalledWith('categories', {
            slug: 'cat_new_12345',
            name: 'NewCat',
            weight: 0.5,
            color: '#000000',
            hide_until: '23:59',
        });
    });

    it('treats a persisted category with a cat_new slug as existing (#166)', async () => {
        // Categories created from Settings keep their generated slug after saving,
        // so they are still prefixed. Such a category must not be treated as new:
        // otherwise it shows the "Новая" placeholder, a grey colour and no delete button.
        const store = useTasksStore();
        store.categories = [
            ...store.categories,
            { id: 4, slug: 'cat_new_1757000000000', name: 'Sport', weight: 0.2, color: '#123456', hide_until: '08:30' },
        ];
        mockRoute.params = { slug: 'cat_new_1757000000000' };

        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        let received = null;
        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        created() {
                            received = { category: this.category, isNew: this.isNew };
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();

        expect(received.isNew).toBe(false);
        expect(received.category).toEqual({
            name: 'Sport',
            weight: 20,  // 0.2 → 20%
            color: '#123456',
            hide_until: '08:30',
        });
    });

    it('renders real name, colour and the delete button for a persisted cat_new category (#166)', async () => {
        const store = useTasksStore();
        store.categories = [
            ...store.categories,
            { id: 4, slug: 'cat_new_1757000000000', name: 'Sport', weight: 0.2, color: '#123456', hide_until: null },
        ];
        mockRoute.params = { slug: 'cat_new_1757000000000' };

        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView);
        await wrapper.vm.$nextTick();

        expect(wrapper.find('input[type="text"]').element.value).toBe('Sport');
        expect(wrapper.find('input[type="color"]').element.value).toBe('#123456');
        expect(wrapper.findAll('button').some(b => b.text().includes('common.delete'))).toBe(true);
    });

    it('handleDelete sends DELETE with category id', async () => {
        mockRoute.params = { slug: 'prog' };
        window.confirm = vi.fn(() => true);

        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        mounted() {
                            this.$emit('delete', 'prog');
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();
        await new Promise(r => setTimeout(r, 20));

        expect(window.confirm).toHaveBeenCalled();
        expect(axios.delete).toHaveBeenCalledWith('categories/2');
        expect(mockPush).toHaveBeenCalledWith('/settings');
    });

    it('handleDelete prevents deleting the last non-archive category', async () => {
        // Leave only one non-archive category
        const store = useTasksStore();
        store.categories = [
            { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#ff3b30', hide_until: null },
            { id: 3, slug: '__archive__', name: 'Archive', weight: 0.01, color: '#8e8e93', hide_until: null },
        ];

        const alertSpy = vi.spyOn(window, 'alert').mockImplementation(() => {});
        mockRoute.params = { slug: 'chor' };

        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        mounted() {
                            this.$emit('delete', 'chor');
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();
        await new Promise(r => setTimeout(r, 20));

        expect(alertSpy).toHaveBeenCalledWith('settings_modal.categories.delete_last_error');
        expect(axios.delete).not.toHaveBeenCalled();

        alertSpy.mockRestore();
    });

    it('handleDelete does nothing when user cancels confirmation', async () => {
        window.confirm = vi.fn(() => false);

        mockRoute.params = { slug: 'prog' };
        const { default: EditCategoryView } = await import(
            '../../../resources/js/views/EditCategoryView.vue'
        );

        const wrapper = mount(EditCategoryView, {
            global: {
                stubs: {
                    EditCategoryModal: {
                        template: '<div class="modal-stub" />',
                        props: ['category', 'slug', 'isNew'],
                        emits: ['save', 'delete'],
                        mounted() {
                            this.$emit('delete', 'prog');
                        },
                    },
                },
            },
        });

        await wrapper.vm.$nextTick();
        await new Promise(r => setTimeout(r, 20));

        expect(axios.delete).not.toHaveBeenCalled();
    });
});
