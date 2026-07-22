<template>
    <div 
        class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
        @click.self="router.push('/settings')"
    >
        <EditCategoryModal 
            v-if="categoryData"
            :category="categoryData.data" 
            :slug="categoryData.slug"
            :is-new="categoryData.isNew"
            class="animate-[scale-up_0.2s_ease-out]"
            @close="router.push('/settings')"
            @save="handleSave"
            @delete="handleDelete"
            @weight-changed="syncWeights"
        />
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';
import { useI18n } from 'vue-i18n';
import EditCategoryModal from '../components/EditCategoryModal.vue';

const route = useRoute();
const router = useRouter();
const store = useBalanceStore();
const { t } = useI18n();

const slug = computed(() => route.params.slug);
const isNew = computed(() => slug.value.startsWith('cat_new'));

const categoryData = computed(() => {
    const cat = store.categories.find(c => c.slug === slug.value);
    if (!cat && !isNew.value) return null;

    return {
        slug: slug.value,
        data: isNew.value 
            ? { name: t('settings_modal.categories.new_category_name'), weight: 10, color: '#8e8e93', hide_until: '' }
            : { name: cat.name, weight: Math.round(parseFloat(cat.weight) * 100), color: cat.color, hide_until: cat.hide_until || '' },
        isNew: isNew.value
    };
});

const syncWeights = (_s, _w) => {
    // We use a simplified sync for the overlay, or we could refactor the sync logic to the store
    // For now, we'll let the save handle the final normalization on the server
};

const handleSave = async (s, data) => {
    try {
        const existing = store.categories.find(c => c.slug === s);
        const payload = {
            name: data.name,
            weight: Math.round(parseFloat(data.weight)) / 100,
            color: data.color,
            hide_until: data.hide_until || null,
        };
        if (existing?.id) {
            await axios.put(`categories/${existing.id}`, payload);
        } else {
            await axios.post('categories', { slug: s, ...payload });
        }
        await store.fetchAll();
        router.push('/settings');
    } catch (e) {
        console.error('Save category error:', e);
        window.alert(t('settings_modal.categories.save_error'));
    }
};

const handleDelete = async (s) => {
    if (store.categories.filter(c => c.slug !== '__archive__').length <= 1) {
        window.alert(t('settings_modal.categories.delete_last_error'));
        return;
    }
    if (window.confirm(t('app.alerts.delete_confirm'))) {
        try {
            const cat = store.categories.find(c => c.slug === s);
            if (cat?.id) {
                await axios.delete(`categories/${cat.id}`);
                await store.fetchAll();
            }
        } catch (e) {
            console.error('Delete category error:', e);
        }
        router.push('/settings');
    }
};
</script>

<style scoped>
@keyframes scale-up {
    from { transform: scale(0.95); opacity: 0; }
    to { transform: scale(1); opacity: 1; }
}
</style>
