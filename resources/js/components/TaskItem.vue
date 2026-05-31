<template>
    <div class="task-item flex items-center py-2.5 border-b border-[var(--color-border)] gap-2.5 last:border-0 transition-opacity" 
         :class="{ 'opacity-50': isDimmed }">
        
        <div class="task-color w-3.5 h-3.5 rounded-full shrink-0" 
             :style="{ background: categoryColor }"
             :class="{ 'opacity-50': isDimmed }"></div>
        
        <div class="task-info flex-[3] min-w-0">
            <div class="task-title font-bold text-[15px] mb-0.5 text-[var(--color-text)]">
                {{ task.title }}
                
                <span v-for="badge in activeBadges" :key="badge.text"
                      class="badge" :class="badge.classes">
                    {{ badge.text }}
                </span>

                <span v-if="task.completed" class="badge-text">
                    {{ t('task.status.completed') }} {{ formatDate(task.completed_at) }}
                </span>
            </div>

            <div class="task-meta text-[11px] text-[var(--color-secondary)]">
                {{ categoryName }} 
                <span v-if="task.subcategory">| {{ task.subcategory }} x{{ getCoeff(task.subcategory) }}</span>
                | {{ t('task.meta.importance') }}: {{ task.importance }} 
                <span v-if="task.deadline">| {{ t('task.meta.deadline') }} {{ formatDate(task.deadline) }}</span>
                | <span class="priority-value font-black" :style="{ color: categoryColor }">
                    {{ task.calculatedPriority?.toFixed(1) }}
                </span>
            </div>
        </div>

        <div v-if="task.notes" class="task-notes text-[10px] text-[var(--color-secondary)] ml-auto mr-2 max-w-[140px] whitespace-pre-wrap break-words leading-tight shrink italic opacity-70">
            {{ task.notes }}
        </div>

        <div class="task-actions flex gap-1 shrink-0">
            <button v-if="canComplete" @click="store.completeTask(task.id)" class="action-btn">✓</button>
            <button v-if="canRestore" @click="store.restoreTask(task.id)" class="action-btn">↩</button>
            <button v-if="canReturnNow" @click="store.returnNow(task.id)" class="action-btn">↩</button>
            
            <button @click="$emit('edit', task)" class="action-btn">✎</button>
            <button @click="$emit('delete', task.id)" class="action-btn">🗑</button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useBalanceStore } from '../stores/balance';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();
const props = defineProps({
    task: { type: Object, required: true }
});

const store = useBalanceStore();

// --- Computed State ---
const category = computed(() => store.categories.find(c => c.slug === props.task.category_slug));
const categoryColor = computed(() => category.value?.color || '#8e8e93');
const categoryName = computed(() => category.value?.name || props.task.category_slug);

const isPostponed = computed(() => store.isEffectivelyPostponed(props.task));
const isHidden = computed(() => store.isHidden(props.task));
const isDimmed = computed(() => isPostponed.value && !isHidden.value);

// --- Action Visibility ---
const canComplete = computed(() => !props.task.completed && !isHidden.value);
const canRestore = computed(() => props.task.completed);
const canReturnNow = computed(() => isHidden.value && !props.task.completed);

// --- Badges Logic ---
const activeBadges = computed(() => {
    const list = [];
    const task = props.task;

    if (isPostponed.value && !isHidden.value) {
        list.push({ text: t('task.status.postponed'), classes: 'bg-[var(--bg-secondary)] text-[var(--color-secondary)]' });
    }
    if (task.ha) {
        list.push({ text: 'HA', classes: 'bg-[var(--bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]' });
    }
    if (task.force_active) {
        list.push({ text: t('task.status.active'), classes: 'bg-[var(--bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]' });
    }
    if (isHidden.value) {
        list.push({ text: `${t('task.status.appears')} ${formatDate(task.hidden_until)}`, classes: 'bg-[var(--bg-secondary)] text-[var(--color-secondary)]' });
    }
    if (task.repeat_type !== 'none' && !task.completed && !isHidden.value) {
        if (task.missed_count > 0) {
            list.push({ text: t('task.status.missed', { n: task.missed_count }), classes: 'bg-red-500/20 text-red-500 font-black' });
        } else if (!isPostponed.value) {
            list.push({ text: t('task.status.repeat'), classes: 'bg-[var(--bg-secondary)] text-[var(--color-secondary)]' });
        }
    }

    return list;
});

// --- Helpers ---
const getCoeff = (s) => store.subcatCoeffs[s] || 1;

const formatDate = (d) => {
    if (!d) return '';
    const dateLocale = store.locale === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(d).toLocaleString(dateLocale, { 
        day: '2-digit', 
        month: '2-digit', 
        hour: '2-digit', 
        minute: '2-digit' 
    });
};
</script>

<style scoped>
@reference "../../css/app.css";

.badge {
    @apply inline-block align-middle ml-1 px-2 py-px rounded-xl text-[9px] font-bold uppercase tracking-wider;
}
.badge-text {
    @apply ml-1 text-xs text-[var(--color-secondary)];
}
.action-btn {
    @apply px-2.5 py-1.5 bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)] rounded-xl font-extrabold text-sm leading-none transition-all shadow-sm hover:bg-[var(--bg-secondary)] hover:border-[var(--color-secondary)] hover:-translate-y-px active:translate-y-0;
}
</style>
