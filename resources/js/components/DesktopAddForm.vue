<template>
    <div class="flex items-center gap-2 mb-3 px-1 shrink-0 z-10 relative">
        <input
            v-model="title" 
            :placeholder="$t('app.placeholder')" 
            class="flex-1 p-[12px_16px] rounded-2xl border border-[var(--color-border)] shadow-sm text-[15px] outline-none focus:ring-2 focus:ring-[var(--color-border)] transition-all bg-[var(--bg-card)] text-[var(--color-text)]" 
            @keyup.enter="handleAddTask"
        >
        
        <button
            class="p-[12px] bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold shadow-sm hover:opacity-80 transition-colors w-[46px] h-[46px] flex items-center justify-center shrink-0 border border-[var(--color-border)]" 
            :title="$t('app.advanced_add') || 'Advanced Add'" 
            @click="emit('open-advanced', title)"
        >
            <svg
                class="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
            </svg>
        </button>
    </div>
</template>

<script setup>
import { ref } from 'vue';
import { useBalanceStore } from '../stores/balance';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const emit = defineEmits(['open-advanced', 'task-added']);
const store = useBalanceStore();
const title = ref('');

const handleAddTask = async () => {
    if (!title.value.trim()) return;

    let categorySlug = store.filterCat;
    if (['all', 'hidden', 'archive'].includes(categorySlug)) {
        const firstCat = store.categories.find(c => c.slug !== '__archive__');
        categorySlug = firstCat ? firstCat.slug : 'chor';
    }

    try {
        await store.addTask({
            title: title.value,
            category_slug: categorySlug,
            importance: 2,
            repeat_type: 'none',
            repeat_interval: 1,
            repeat_days: [],
            deadline: '',
            postpone_until: '',
            ha: false,
            force_active: false,
            notes: '',
        });
        title.value = '';
        emit('task-added');
    } catch {
        window.alert(t('app.alerts.add_error'));
    }
};
</script>
