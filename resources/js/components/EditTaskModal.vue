<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-2 sm:p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-[24px] sm:rounded-[32px] w-full max-w-md shadow-2xl relative h-[80vh] landscape:h-[95vh] flex flex-col overflow-hidden border border-[var(--color-border)]">
            <!-- Header (Fixed) -->
            <div class="p-4 sm:p-5 pb-3 shrink-0 landscape:p-3 landscape:pb-1 flex items-center gap-2 sm:gap-4">
                <input v-model="editData.title" type="text" 
                       class="flex-1 min-w-0 p-0 bg-transparent border-none text-xl sm:text-2xl font-black text-[var(--color-text)] outline-none placeholder:opacity-30 landscape:text-base" 
                       :placeholder="$t('edit_task.title')">
                <div @click="$emit('close')" class="shrink-0 w-8 h-8 flex items-center justify-center cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors" title="Close">
                    &times;
                </div>
            </div>

            <!-- Tabs Nav (Fixed) -->
            <div class="px-5 mb-2 shrink-0 landscape:px-3 landscape:mb-1">
                <div class="flex gap-1 bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--color-border)] landscape:rounded-lg">
                    <button v-for="t in ['notes', 'setup', 'schedule', 'history']" :key="t"
                            @click="activeTab = t"
                            :class="['flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-none shadow-none relative landscape:py-1 landscape:text-[8px]', 
                                     activeTab === t ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                        {{ $t(`edit_task.tabs.${t}`) }}
                        <div v-if="activeTab === t" class="absolute -bottom-1 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-[var(--color-primary)] rounded-full"></div>
                    </button>
                </div>
            </div>

            <!-- Main Content (Scrollable) -->
            <div class="flex-1 overflow-y-auto p-5 pt-2 custom-scrollbar min-h-0 landscape:p-3 landscape:pt-1"
                 @touchstart="handleTouchStart"
                 @touchend="handleTouchEnd">
                <!-- Tab: Notes (Log) -->
                <div v-if="activeTab === 'notes'" class="h-full flex flex-col">
                    <textarea v-model="editData.notes" 
                              ref="notesTextarea" 
                              class="flex-1 w-full p-0 bg-transparent border-none text-sm resize-none outline-none text-[var(--color-text)] placeholder:text-[var(--color-secondary)]/50 leading-relaxed custom-scrollbar" 
                              :placeholder="$t('edit_task.notes_placeholder')"></textarea>
                </div>

                <!-- Tab: History -->
                <div v-if="activeTab === 'history'" class="space-y-4">
                    <div v-if="loadingHistory" class="flex justify-center py-10">
                        <div class="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div v-else-if="!fullTaskDetails?.completions?.length" class="text-center py-10 text-[var(--color-secondary)] text-xs italic">
                        {{ $t('app.no_tasks_in_category') }}
                    </div>
                    <div v-else class="space-y-3">
                        <div class="flex items-center justify-between px-1">
                            <span class="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-widest">{{ $t('stats.counters.total') }}</span>
                            <span class="text-sm font-black text-[var(--color-text)]">{{ fullTaskDetails.completions.length }}</span>
                        </div>
                        <div class="space-y-2">
                            <div v-for="comp in fullTaskDetails.completions" :key="comp.id" 
                                 class="bg-[var(--bg-secondary)]/50 p-3 rounded-2xl border border-[var(--color-border)] flex items-center justify-between">
                                <div class="flex flex-col">
                                    <span class="text-xs font-bold text-[var(--color-text)]">{{ formatDate(comp.completed_at) }}</span>
                                    <span class="text-[10px] text-[var(--color-secondary)]">{{ formatTime(comp.completed_at) }}</span>
                                </div>
                                <div class="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7"></path></svg>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Tab: Setup (Params) -->
                <div v-if="activeTab === 'setup'" class="space-y-5">
                    <div class="flex gap-4 p-4 bg-[var(--bg-secondary)]/50 rounded-2xl border border-[var(--color-border)]">
                        <label class="flex-1 flex items-center justify-between cursor-pointer group">
                            <span class="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{{ $t('edit_task.done') }}</span>
                            <input type="checkbox" v-model="editData.completed" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                        </label>
                        <div v-if="!editData.completed" class="w-px bg-[var(--color-border)]"></div>
                        <label v-if="!editData.completed" class="flex-1 flex items-center justify-between cursor-pointer group">
                            <span class="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">HA</span>
                            <input type="checkbox" v-model="editData.ha" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                        </label>
                    </div>

                    <div class="grid grid-cols-2 gap-4">
                        <div>
                            <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.category') }}</label>
                            <select v-model="editData.category_slug" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                                <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
                            </select>
                        </div>
                        <div>
                            <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.importance') }}</label>
                            <select v-model="editData.importance" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                                <option value="4">{{ $t('edit_task.importance_levels.very_high') }}</option>
                                <option value="3">{{ $t('edit_task.importance_levels.high') }}</option>
                                <option value="2">{{ $t('edit_task.importance_levels.medium') }}</option>
                                <option value="1">{{ $t('edit_task.importance_levels.low') }}</option>
                                <option value="0.5">{{ $t('edit_task.importance_levels.very_low') }}</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.subcategory') }}</label>
                        <input v-model="editData.subcategory" list="subcat-list-edit" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                        <datalist id="subcat-list-edit"><option v-for="s in store.allSubcats" :key="s" :value="s"></option></datalist>
                    </div>

                    <div class="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--color-border)]">
                        <label class="flex items-center justify-between cursor-pointer group">
                            <span class="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{{ $t('edit_task.force_active') }}</span>
                            <input type="checkbox" v-model="editData.force_active" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                        </label>
                    </div>
                </div>

                <!-- Tab: Schedule (Time) -->
                <div v-if="activeTab === 'schedule'" class="space-y-4">
                    <div class="grid grid-cols-2 gap-3">
                        <div>
                            <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.deadline') }}</label>
                            <input v-model="editData.deadline" type="datetime-local" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none">
                        </div>
                        <div>
                            <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.postpone_until') }}</label>
                            <input v-model="editData.postpone_until" type="datetime-local" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none">
                        </div>
                    </div>

                    <div class="space-y-3 pt-3 border-t border-[var(--color-border)]">
                        <div>
                            <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.repeat.type') }}</label>
                            <select v-model="editData.repeat_type" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] outline-none">
                                <option value="none">{{ $t('edit_task.repeat.none') }}</option>
                                <option value="interval">{{ $t('edit_task.repeat.interval') }}</option>
                                <option value="weekly">{{ $t('edit_task.repeat.weekly') }}</option>
                            </select>
                        </div>

                        <div v-if="editData.repeat_type === 'interval'" class="flex items-center gap-3 p-3 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--color-border)]">
                            <span class="text-[11px] font-bold text-[var(--color-text)]">{{ $t('edit_task.repeat.every') }}</span>
                            <input v-model.number="editData.repeat_interval" type="number" min="1" class="w-16 p-1.5 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-lg text-center font-bold text-xs text-[var(--color-text)]">
                            <span class="text-[11px] font-bold text-[var(--color-text)]">{{ $t('edit_task.repeat.days') }}</span>
                        </div>

                        <div v-if="editData.repeat_type === 'weekly'" class="flex gap-1.5 flex-wrap justify-between">
                            <label v-for="(day, idx) in $tm('edit_task.weekdays')" :key="idx" 
                                   :class="['w-8 h-8 flex-1 min-w-[32px] flex items-center justify-center rounded-lg text-[9px] font-black cursor-pointer transition-all border shadow-sm', 
                                            editData.repeat_days.includes(idx) ? 'bg-[var(--color-text)] text-[var(--bg-card)] border-[var(--color-text)]' : 'bg-[var(--bg-secondary)] text-[var(--color-secondary)] border-[var(--color-border)]']">
                                <input type="checkbox" :value="idx" v-model="editData.repeat_days" class="hidden">
                                {{ day }}
                            </label>
                        </div>

                        <div v-if="editData.completed" class="pt-2">
                            <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.completed_at') }}</label>
                            <input v-model="editData.completed_at" type="datetime-local" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none">
                        </div>
                    </div>
                </div>
            </div>

            <!-- Footer (Fixed) -->
            <div class="p-5 border-t border-[var(--color-border)] bg-[var(--bg-card)] shrink-0 flex gap-2 landscape:p-2">
                <button v-if="!isNew" @click="handleDelete" 
                        class="w-14 py-4 landscape:py-2 bg-[var(--bg-secondary)] text-red-500 rounded-2xl landscape:rounded-xl flex items-center justify-center hover:bg-red-500/10 transition-colors border border-[var(--color-border)] shadow-none">
                    <svg class="w-6 h-6 landscape:w-5 landscape:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
                </button>
                <button @click="handleSave" class="flex-1 py-4 landscape:py-2 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl landscape:rounded-xl font-black text-sm landscape:text-xs shadow-lg hover:opacity-90 active:scale-[0.98] transition-all uppercase tracking-widest">
                    {{ $t('common.save') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    task: Object,
    isNew: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['close', 'saved']);
const store = useBalanceStore();
const { t } = useI18n();
const notesTextarea = ref(null);
const activeTab = ref('notes');
const tabs = ['notes', 'setup', 'schedule', 'history'];

const fullTaskDetails = ref(null);
const loadingHistory = ref(false);

const fetchFullDetails = async () => {
    if (props.isNew) return;
    loadingHistory.value = true;
    try {
        const res = await axios.get(`tasks/${props.task.id}`);
        fullTaskDetails.value = res.data;
    } catch (e) {
        console.error('Failed to fetch task history', e);
    } finally {
        loadingHistory.value = false;
    }
};

// Swipe logic
const touchStart = ref({ x: 0, y: 0 });
const handleTouchStart = (e) => {
    touchStart.value = { 
        x: e.touches[0].clientX, 
        y: e.touches[0].clientY 
    };
};
const handleTouchEnd = (e) => {
    const touchEnd = { 
        x: e.changedTouches[0].clientX, 
        y: e.changedTouches[0].clientY 
    };
    const dx = touchStart.value.x - touchEnd.x;
    const dy = touchStart.value.y - touchEnd.y;
    const threshold = 60; // minimum horizontal distance
    const verticalThreshold = 40; // maximum vertical distance allowed for horizontal swipe

    if (Math.abs(dx) > threshold && Math.abs(dy) < verticalThreshold) {
        const currentIndex = tabs.indexOf(activeTab.value);
        if (dx > 0 && currentIndex < tabs.length - 1) {
            // Swipe Left -> Next Tab
            activeTab.value = tabs[currentIndex + 1];
        } else if (dx < 0 && currentIndex > 0) {
            // Swipe Right -> Prev Tab
            activeTab.value = tabs[currentIndex - 1];
        }
    }
};

const editData = reactive({
    ...props.task,
    // Format dates for input[type="datetime-local"]
    deadline: props.task.deadline ? props.task.deadline.substring(0, 16) : '',
    postpone_until: props.task.postpone_until ? props.task.postpone_until.substring(0, 16) : '',
    completed_at: props.task?.completed_at ? props.task.completed_at.substring(0, 16) : '',
    repeat_days: props.task.repeat_days || []
});

const autoResize = () => {
    const el = notesTextarea.value;
    if (el && activeTab.value === 'notes') {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }
};

const formatDate = (d) => {
    if (!d) return '';
    const dateLocale = store.locale === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(d).toLocaleDateString(dateLocale, { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric'
    });
};

const formatTime = (d) => {
    if (!d) return '';
    const dateLocale = store.locale === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(d).toLocaleTimeString(dateLocale, { 
        hour: '2-digit', 
        minute: '2-digit'
    });
};

const handleSave = async () => {
    try {
        const payload = {
            ...editData,
            deadline: editData.deadline || null,
            postpone_until: editData.postpone_until || null,
            completed_at: editData.completed_at || null,
        };
        
        if (props.isNew) {
            await store.addTask(payload);
        } else {
            await store.updateTask(props.task.id, payload);
        }
        
        emit('saved');
        emit('close');
    } catch (e) {
        alert(t('edit_task.save_error'));
    }
};

const handleDelete = async () => {
    if (confirm(t('app.alerts.delete_confirm'))) {
        try {
            await store.deleteTask(props.task.id);
            emit('close');
        } catch (e) {
            alert(t('app.alerts.delete_error'));
        }
    }
};

onMounted(() => {
    fetchFullDetails();
    setTimeout(autoResize, 50);
});
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar {
    width: 4px;
}
.custom-scrollbar::-webkit-scrollbar-track {
    background: transparent;
}
.custom-scrollbar::-webkit-scrollbar-thumb {
    background: var(--color-border);
    border-radius: 10px;
}
</style>
