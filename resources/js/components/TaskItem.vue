<template>
    <div class="task-item flex items-center py-[10px] border-b border-[var(--color-border)] gap-[10px] last:border-0" 
         :style="{ opacity: (store.isEffectivelyPostponed(task) && !store.isHidden(task)) ? 0.5 : 1 }">
        <div class="task-color w-[14px] h-[14px] rounded-full shrink-0" 
             :style="{ 
                 background: categoryColor, 
                 opacity: (store.isEffectivelyPostponed(task) && !store.isHidden(task)) ? 0.5 : 1 
             }"></div>
        
        <div class="task-info flex-[3] min-w-0">
            <div class="task-title font-bold text-[15px] mb-[2px] text-[var(--color-text)]">
                {{ task.title }}
                <span v-if="store.isEffectivelyPostponed(task) && !store.isHidden(task)" class="badge bg-[var(--bg-secondary)] text-[var(--color-secondary)]">отложено</span>
                <span v-if="task.ha" class="badge bg-[var(--bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]">HA</span>
                <span v-if="task.force_active" class="badge bg-[var(--bg-secondary)] text-[var(--color-text)] border border-[var(--color-border)]">актуально</span>
                <span v-if="store.isHidden(task)" class="badge bg-[var(--bg-secondary)] text-[var(--color-secondary)]">появится {{ formatDate(task.hidden_until) }}</span>
                <span v-if="task.repeat_type !== 'none' && !task.completed && task.missed_count > 0 && !store.isHidden(task)" class="badge bg-red-500/20 text-red-500 font-black">проср. {{ task.missed_count }}д</span>
                <span v-if="task.repeat_type !== 'none' && !task.completed && task.missed_count === 0 && !store.isHidden(task) && !store.isEffectivelyPostponed(task)" class="badge bg-[var(--bg-secondary)] text-[var(--color-secondary)]">повтор</span>
                <span v-if="task.completed" class="badge-text">вып. {{ formatDate(task.completed_at) }}</span>
            </div>
            <div class="task-meta text-[11px] text-[var(--color-secondary)]">
                {{ categoryName }} 
                <span v-if="task.subcategory">| {{ task.subcategory }} x{{ getCoeff(task.subcategory) }}</span>
                | Важн: {{ task.importance }} 
                <span v-if="task.deadline">| Дедлайн {{ formatDate(task.deadline) }}</span>
                | <span class="priority-value font-black" :style="{ color: categoryColor }">
                    {{ task.calculatedPriority?.toFixed(1) }}
                </span>
            </div>
        </div>

        <div v-if="task.notes" class="task-notes text-[10px] text-[var(--color-secondary)] ml-auto mr-2 max-w-[140px] whitespace-pre-wrap break-words leading-[1.2] shrink italic opacity-70">
            {{ task.notes }}
        </div>

        <div class="task-actions flex gap-1 shrink-0">
            <button v-if="!task.completed && !store.isHidden(task)" @click="store.completeTask(task.id)" 
                    class="action-btn">
                ✓
            </button>
            <button v-if="store.isHidden(task) && !task.completed" @click="store.returnNow(task.id)" 
                    class="action-btn">
                ↩
            </button>
            <button v-if="task.completed" @click="store.restoreTask(task.id)" 
                    class="action-btn">
                ↩
            </button>
            <button @click="$emit('edit', task)" 
                    class="action-btn">
                ✎
            </button>
            <button @click="$emit('delete', task.id)" 
                    class="action-btn">
                🗑
            </button>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useBalanceStore } from '../stores/balance';

const props = defineProps({
    task: Object
});

const store = useBalanceStore();

const category = computed(() => store.categories.find(c => c.slug === props.task.category_slug));
const categoryColor = computed(() => category.value?.color || '#8e8e93');
const categoryName = computed(() => category.value?.name || props.task.category_slug);

const getCoeff = (s) => store.subcatCoeffs[s] || 1;

const formatDate = (d) => {
    if (!d) return '';
    return new Date(d).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
};
</script>

<style scoped>
.badge {
    border-radius: 12px;
    padding: 1px 8px;
    font-size: 9px;
    font-weight: 700;
    margin-left: 4px;
    display: inline-block;
    vertical-align: middle;
    text-transform: uppercase;
    letter-spacing: 0.02em;
}
.badge-text {
    color: var(--color-secondary);
    font-size: 10px;
    margin-left: 4px;
}
.action-btn {
    padding: 6px 10px;
    font-size: 14px;
    background: var(--bg-card);
    color: var(--color-text);
    border: 1px solid var(--color-border);
    border-radius: 12px;
    font-weight: 800;
    line-height: 1;
    transition: all 0.2s ease;
    box-shadow: 0 1px 2px rgba(0,0,0,0.05);
}
.action-btn:hover {
    background: var(--bg-secondary);
    border-color: var(--color-secondary);
    transform: translateY(-1px);
}
.action-btn:active {
    transform: translateY(0);
}
</style>
