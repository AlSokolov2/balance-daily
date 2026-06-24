<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- New Modern Header -->
        <div class="px-4 py-4 flex items-center justify-between border-b border-[var(--color-border)] shrink-0 bg-[var(--bg-app)]">
            <button 
                class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-all border border-[var(--color-border)] shadow-none"
                @click="$emit('close')"
            >
                <svg
                    class="w-5 h-5 text-[var(--color-text)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M15 19l-7-7 7-7"
                /></svg>
            </button>
            
            <div class="flex-1 px-4 min-w-0">
                <input
                    v-model="editData.title"
                    type="text" 
                    class="w-full p-0 bg-transparent border-none text-lg font-black text-[var(--color-text)] outline-none placeholder:opacity-30" 
                    :placeholder="$t('edit_task.title')"
                >
            </div>

            <button 
                class="px-5 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all border border-[var(--color-border)] uppercase tracking-widest"
                @click="handleSave"
            >
                {{ $t('common.save') }}
            </button>
        </div>

        <!-- Tabs Nav (Sticky) -->
        <div class="px-5 py-3 shrink-0 bg-[var(--bg-app)]">
            <div class="flex gap-1 bg-[var(--bg-secondary)]/50 p-1 rounded-xl border border-[var(--color-border)]">
                <button
                    v-for="tabItem in ['notes', 'setup', 'schedule', 'history']"
                    :key="tabItem"
                    :class="['flex-1 py-2 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all border-none shadow-none relative', 
                             activeTab === tabItem ? 'bg-[var(--bg-card)] text-[var(--color-primary)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)]']"
                    @click="activeTab = tabItem"
                >
                    {{ $t(`edit_task.tabs.${tabItem}`) }}
                </button>
            </div>
        </div>

        <!-- Main Content (Scrollable) -->
        <div
            class="flex-1 overflow-y-auto p-5 pt-0 custom-scrollbar min-h-0"
            @touchstart="handleTouchStart"
            @touchend="handleTouchEnd"
        >
            <!-- Tab: Notes (Log) -->
            <div v-if="activeTab === 'notes'" class="h-full flex flex-col">
                <textarea
                    ref="notesTextarea" 
                    v-model="editData.notes" 
                    class="flex-1 w-full p-0 bg-transparent border-none text-sm resize-none outline-none text-[var(--color-text)] placeholder:text-[var(--color-secondary)]/50 leading-relaxed custom-scrollbar" 
                    :placeholder="$t('edit_task.notes_placeholder')"
                />
            </div>

            <!-- Tab: History -->
            <div v-if="activeTab === 'history'" class="space-y-4">
                <!-- Add completion form -->
                <div class="flex gap-2">
                    <input
                        v-model="newCompletionDate"
                        type="datetime-local"
                        class="flex-1 p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none"
                    >
                    <button
                        class="px-4 py-2.5 bg-[var(--color-primary)] text-white rounded-xl text-xs font-bold hover:opacity-80"
                        :disabled="!newCompletionDate"
                        @click="addCompletion"
                    >
                        + {{ $t('edit_task.add_completion') }}
                    </button>
                </div>

                <div v-if="loadingHistory" class="flex justify-center py-10">
                    <div class="w-6 h-6 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                </div>
                <div v-else-if="!fullTaskDetails?.completions?.length" class="text-center py-6 text-[var(--color-secondary)] text-xs italic">
                    {{ $t('edit_task.no_completions') }}
                </div>
                <div v-else class="space-y-3">
                    <div class="flex items-center justify-between px-1">
                        <span class="text-[10px] font-black text-[var(--color-secondary)] uppercase tracking-widest">{{ $t('stats.counters.total') }}</span>
                        <span class="text-sm font-black text-[var(--color-text)]">{{ fullTaskDetails.completions.length }}</span>
                    </div>
                    <div class="space-y-2">
                        <div
                            v-for="comp in fullTaskDetails.completions"
                            :key="comp.id"
                            class="bg-[var(--bg-secondary)]/50 p-3 rounded-2xl border border-[var(--color-border)] flex items-center justify-between"
                        >
                            <div class="flex flex-col">
                                <span class="text-xs font-bold text-[var(--color-text)]">{{ formatDate(comp.completed_at) }}</span>
                                <span class="text-[10px] text-[var(--color-secondary)]">{{ formatTime(comp.completed_at) }}</span>
                            </div>
                            <div class="flex items-center gap-2">
                                <div class="w-6 h-6 rounded-lg bg-green-500/10 flex items-center justify-center text-green-500">
                                    <svg
                                        class="w-4 h-4"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="3"
                                        d="M5 13l4 4L19 7"
                                    /></svg>
                                </div>
                                <button
                                    class="w-6 h-6 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500 hover:bg-red-500/20"
                                    :title="$t('edit_task.delete_completion')"
                                    @click="deleteCompletion(comp.id)"
                                >
                                    <svg
                                        class="w-3 h-3"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    ><path
                                        stroke-linecap="round"
                                        stroke-linejoin="round"
                                        stroke-width="3"
                                        d="M6 18L18 6M6 6l12 12"
                                    /></svg>
                                </button>
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
                        <input v-model="editData.completed" type="checkbox" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                    </label>
                    <div v-if="!editData.completed" class="w-px bg-[var(--color-border)]" />
                    <label v-if="!editData.completed" class="flex-1 flex items-center justify-between cursor-pointer group">
                        <span class="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">HA</span>
                        <input v-model="editData.ha" type="checkbox" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                    </label>
                </div>

                <div class="grid grid-cols-2 gap-4">
                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.category') }}</label>
                        <select v-model="editData.category_slug" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                            <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">
                                {{ cat.name }}
                            </option>
                        </select>
                    </div>
                    <div>
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.importance') }}</label>
                        <select v-model="editData.importance" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                            <option value="4">
                                {{ $t('edit_task.importance_levels.very_high') }}
                            </option>
                            <option value="3">
                                {{ $t('edit_task.importance_levels.high') }}
                            </option>
                            <option value="2">
                                {{ $t('edit_task.importance_levels.medium') }}
                            </option>
                            <option value="1">
                                {{ $t('edit_task.importance_levels.low') }}
                            </option>
                            <option value="0.5">
                                {{ $t('edit_task.importance_levels.very_low') }}
                            </option>
                        </select>
                    </div>
                </div>

                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-2">{{ $t('edit_task.subcategory') }}</label>
                    <input v-model="editData.subcategory" list="subcat-list-edit" class="w-full p-3 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-2xl text-sm text-[var(--color-text)] outline-none focus:ring-2 focus:ring-[var(--color-border)]">
                    <datalist id="subcat-list-edit">
                        <option v-for="s in store.allSubcats" :key="s" :value="s" />
                    </datalist>
                </div>

                <div class="p-4 bg-[var(--bg-secondary)]/30 rounded-2xl border border-[var(--color-border)]">
                    <label class="flex items-center justify-between cursor-pointer group">
                        <span class="text-xs font-bold text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{{ $t('edit_task.force_active') }}</span>
                        <input v-model="editData.force_active" type="checkbox" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
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
                    <div>
                        <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.hidden_until') }}</label>
                        <input v-model="editData.hidden_until" type="datetime-local" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none">
                    </div>
                </div>

                <div class="space-y-3 pt-3 border-t border-[var(--color-border)]">
                    <div>
                        <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.repeat.type') }}</label>
                        <select v-model="editData.repeat_type" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] outline-none">
                            <option value="none">
                                {{ $t('edit_task.repeat.none') }}
                            </option>
                            <option value="interval">
                                {{ $t('edit_task.repeat.interval') }}
                            </option>
                            <option value="weekly">
                                {{ $t('edit_task.repeat.weekly') }}
                            </option>
                        </select>
                    </div>

                    <div v-if="editData.repeat_type === 'interval'" class="flex items-center gap-3 p-3 bg-[var(--bg-secondary)]/50 rounded-xl border border-[var(--color-border)]">
                        <span class="text-[11px] font-bold text-[var(--color-text)]">{{ $t('edit_task.repeat.every') }}</span>
                        <input
                            v-model.number="editData.repeat_interval"
                            type="number"
                            min="1"
                            class="w-16 p-1.5 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-lg text-center font-bold text-xs text-[var(--color-text)]"
                        >
                        <span class="text-[11px] font-bold text-[var(--color-text)]">{{ $t('edit_task.repeat.days') }}</span>
                    </div>

                    <div v-if="editData.repeat_type === 'weekly'" class="flex gap-1.5 flex-wrap justify-between">
                        <label
                            v-for="(dayName, dayIdx) in $tm('edit_task.weekdays')"
                            :key="dayIdx" 
                            :class="['w-8 h-8 flex-1 min-w-[32px] flex items-center justify-center rounded-lg text-[9px] font-black cursor-pointer transition-all border shadow-sm', 
                                     editData.repeat_days.includes(dayIdx) ? 'bg-[var(--color-text)] text-[var(--bg-card)] border-[var(--color-text)]' : 'bg-[var(--bg-secondary)] text-[var(--color-secondary)] border-[var(--color-border)]']"
                        >
                            <input
                                v-model="editData.repeat_days"
                                type="checkbox"
                                :value="dayIdx"
                                class="hidden"
                            >
                            {{ dayName }}
                        </label>
                    </div>

                    <div v-if="editData.completed" class="pt-2">
                        <label class="text-[9px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-1.5">{{ $t('edit_task.completed_at') }}</label>
                        <input v-model="editData.completed_at" type="datetime-local" class="w-full p-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-[11px] text-[var(--color-text)] outline-none">
                    </div>
                </div>

                <!-- Reminder Times -->
                <div class="space-y-2 pt-3 border-t border-[var(--color-border)]">
                    <div class="flex items-center justify-between px-1">
                        <span class="text-[9px] text-[var(--color-secondary)] uppercase font-black tracking-widest">{{ $t('edit_task.reminder_times') }}</span>
                        <button
                            class="w-6 h-6 rounded-lg bg-[var(--color-primary)] text-white flex items-center justify-center text-xs font-black"
                            @click="addReminderTime"
                        >
                            +
                        </button>
                    </div>
                    <div
                        v-for="(rt, idx) in editData.reminder_times"
                        :key="idx"
                        class="flex items-center gap-2"
                    >
                        <input
                            v-model="editData.reminder_times[idx]"
                            type="time"
                            class="flex-1 p-2 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-xl text-xs text-[var(--color-text)] outline-none"
                        >
                        <button
                            class="w-6 h-6 rounded-lg bg-red-500/10 text-red-500 flex items-center justify-center text-xs"
                            @click="removeReminderTime(idx)"
                        >
                            ×
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Footer (Fixed) -->
        <div class="p-5 border-t border-[var(--color-border)] bg-[var(--bg-app)] shrink-0 flex gap-2">
            <button
                v-if="!isNew"
                class="w-14 py-4 bg-[var(--bg-secondary)] text-red-500 rounded-2xl flex items-center justify-center hover:bg-red-500/10 transition-colors border border-[var(--color-border)] shadow-none" 
                @click="handleDelete"
            >
                <svg
                    class="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                /></svg>
            </button>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';
import { useI18n } from 'vue-i18n';

const props = defineProps({
    task: {
        type: Object,
        default: () => ({})
    },
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
const newCompletionDate = ref('');

const fetchFullDetails = async () => {
    if (props.isNew) return;
    loadingHistory.value = true;
    try {
        const res = await axios.get(`tasks/${props.task.id}`);
        fullTaskDetails.value = res.data;
    } catch {
        // Error
    } finally {
        loadingHistory.value = false;
    }
};

const addCompletion = async () => {
    if (!newCompletionDate.value || !fullTaskDetails.value) return;
    try {
        const res = await axios.post('task-completions', {
            task_id: props.task.id,
            completed_at: newCompletionDate.value,
        });
        fullTaskDetails.value.completions.unshift(res.data);
        newCompletionDate.value = '';
    } catch (e) {
        console.error('Add completion error:', e);
    }
};

const deleteCompletion = async (completionId) => {
    if (!window.confirm(t('edit_task.confirm_delete_completion'))) return;
    try {
        await axios.delete(`task-completions/${completionId}`);
        if (fullTaskDetails.value?.completions) {
            fullTaskDetails.value.completions = fullTaskDetails.value.completions.filter(c => c.id !== completionId);
        }
    } catch (e) {
        console.error('Delete completion error:', e);
    }
};

const addReminderTime = () => {
    editData.reminder_times.push('09:00');
};

const removeReminderTime = (idx) => {
    editData.reminder_times.splice(idx, 1);
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
    hidden_until: props.task.hidden_until ? props.task.hidden_until.substring(0, 16) : '',
    completed_at: props.task?.completed_at ? props.task.completed_at.substring(0, 16) : '',
    repeat_days: props.task.repeat_days || [],
    reminder_times: props.task.reminder_times?.length ? [...props.task.reminder_times] : [],
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
            hidden_until: editData.hidden_until || null,
            completed_at: editData.completed_at || null,
        };
        
        if (props.isNew) {
            await store.addTask(payload);
        } else {
            await store.updateTask(props.task.id, payload);
        }
        
        emit('saved');
        emit('close');
    } catch {
        window.alert(t('edit_task.save_error'));
    }
};

const handleDelete = async () => {
    if (window.confirm(t('app.alerts.delete_confirm'))) {
        try {
            await store.deleteTask(props.task.id);
            emit('close');
        } catch {
            window.alert(t('app.alerts.delete_error'));
        }
    }
};

onMounted(() => {
    fetchFullDetails();
    window.setTimeout(autoResize, 50);
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
