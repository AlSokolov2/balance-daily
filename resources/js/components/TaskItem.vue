<template>
    <div class="task-item flex items-center py-[10px] border-b border-[#e5e5ea] gap-[10px] last:border-0" 
         :style="{ opacity: (store.isEffectivelyPostponed(task) && !store.isHidden(task)) ? 0.5 : 1 }">
        <div class="task-color w-[14px] h-[14px] rounded-full shrink-0" 
             :style="{ 
                 background: categoryColor, 
                 opacity: (store.isEffectivelyPostponed(task) && !store.isHidden(task)) ? 0.5 : 1 
             }"></div>
        
        <div class="task-info flex-[3] min-w-0">
            <div class="task-title font-medium text-[15px] mb-[2px] text-[#1c1c1e]">
                {{ task.title }}
                <span v-if="store.isEffectivelyPostponed(task) && !store.isHidden(task)" class="badge bg-[#fff3cd] text-[#856404]">отложено</span>
                <span v-if="task.ha" class="badge bg-[#d1e7ff] text-[#004085]">HA</span>
                <span v-if="task.force_active" class="badge bg-[#d4edda] text-[#155724]">актуально</span>
                <span v-if="store.isHidden(task)" class="badge bg-[#e0e0e0] text-[#555]">появится {{ formatDate(task.hidden_until) }}</span>
                <span v-if="task.repeat_type !== 'none' && !task.completed && task.missed_count > 0 && !store.isHidden(task)" class="badge bg-[#ff3b30] text-white">проср. {{ task.missed_count }}д</span>
                <span v-if="task.repeat_type !== 'none' && !task.completed && task.missed_count === 0 && !store.isHidden(task) && !store.isEffectivelyPostponed(task)" class="badge bg-[#e5e5ea] text-[#1c1c1e]">повтор</span>
                <span v-if="task.completed" class="badge-text">вып. {{ formatDate(task.completed_at) }}</span>
            </div>
            <div class="task-meta text-[11px] text-[#8e8e93]">
                {{ categoryName }} 
                <span v-if="task.subcategory">| {{ task.subcategory }} x{{ getCoeff(task.subcategory) }}</span>
                | Важн: {{ task.importance }} 
                <span v-if="task.deadline">| Дедлайн {{ formatDate(task.deadline) }}</span>
                | <span class="priority-value font-semibold" :style="{ color: categoryColor }">
                    {{ task.calculatedPriority?.toFixed(1) }}
                </span>
            </div>
        </div>

        <div v-if="task.notes" class="task-notes text-[10px] text-[#8e8e93] ml-auto mr-2 max-w-[140px] whitespace-pre-wrap break-words leading-[1.2] shrink italic">
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
    border-radius: 10px;
    padding: 1px 6px;
    font-size: 10px;
    margin-left: 4px;
    display: inline-block;
    vertical-align: middle;
}
.badge-text {
    color: #8e8e93;
    font-size: 10px;
    margin-left: 4px;
}
.action-btn {
    padding: 5px 8px;
    font-size: 14px;
    background: transparent;
    color: #1c1c1e;
    border: 1px solid #c6c6c8;
    border-radius: 10px;
    font-weight: normal;
    line-height: 1;
}
.action-btn:hover {
    background: #f2f2f7;
}
</style>
