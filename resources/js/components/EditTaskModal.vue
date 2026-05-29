<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto overflow-x-hidden border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-[var(--color-text)]">{{ isNew ? $t('edit_task.new_task') : $t('edit_task.edit') }}</h2>
                <div v-if="!isNew" class="flex items-center gap-2 mr-auto ml-2 sm:ml-5">
                    <span class="text-sm font-semibold text-[var(--color-text)]">{{ $t('edit_task.done') }}</span>
                    <input type="checkbox" v-model="editData.completed" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                </div>
                <span @click="$emit('close')" class="cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors">&times;</span>
            </div>

            <div class="space-y-3">
                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.title') }}</label>
                    <input v-model="editData.title" type="text" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                </div>

                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.notes') }}</label>
                    <textarea v-model="editData.notes" @input="autoResize" ref="notesTextarea" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)]/50 text-[var(--color-text)]" :placeholder="$t('edit_task.notes_placeholder')"></textarea>
                </div>

                <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.category') }}</label>
                        <select v-model="editData.category_slug" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--color-text)]">
                            <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
                        </select>
                    </div>
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.importance') }}</label>
                        <select v-model="editData.importance" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--color-text)]">
                            <option value="4">{{ $t('edit_task.importance_levels.very_high') }}</option>
                            <option value="3">{{ $t('edit_task.importance_levels.high') }}</option>
                            <option value="2">{{ $t('edit_task.importance_levels.medium') }}</option>
                            <option value="1">{{ $t('edit_task.importance_levels.low') }}</option>
                            <option value="0.5">{{ $t('edit_task.importance_levels.very_low') }}</option>
                        </select>
                    </div>
                </div>

                <div class="min-w-0">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.subcategory') }}</label>
                    <input v-model="editData.subcategory" list="subcat-list-edit" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    <datalist id="subcat-list-edit"><option v-for="s in store.allSubcats" :key="s" :value="s"></option></datalist>
                </div>

                <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.deadline') }}</label>
                        <input v-model="editData.deadline" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    </div>
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.postpone_until') }}</label>
                        <input v-model="editData.postpone_until" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    </div>
                </div>

                <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 py-2 border-t border-b border-[var(--color-border)]">
                    <select v-model="editData.repeat_type" class="flex-1 p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                        <option value="none">{{ $t('edit_task.repeat.none') }}</option>
                        <option value="interval">{{ $t('edit_task.repeat.interval') }}</option>
                        <option value="weekly">{{ $t('edit_task.repeat.weekly') }}</option>
                    </select>
                    <label class="flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)]">HA <input type="checkbox" v-model="editData.ha" class="accent-[var(--color-text)]"></label>
                    <label class="flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)]">{{ $t('edit_task.force_active') }} <input type="checkbox" v-model="editData.force_active" class="accent-[var(--color-text)]"></label>
                </div>

                <div v-if="editData.repeat_type === 'interval'" class="flex items-center gap-2 text-xs">
                    <label class="text-[var(--color-secondary)]">{{ $t('edit_task.repeat.every') }}</label>
                    <input v-model.number="editData.repeat_interval" type="number" min="1" class="w-16 p-2 border border-[var(--color-border)] rounded-xl text-center bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    <label class="text-[var(--color-secondary)]">{{ $t('edit_task.repeat.days') }}</label>
                </div>

                <div v-if="editData.repeat_type === 'weekly'" class="flex gap-1.5 flex-wrap">
                    <label v-for="(day, idx) in $tm('edit_task.weekdays')" :key="idx" :class="['px-2.5 py-1.5 border rounded-xl text-[10px] font-bold cursor-pointer transition-all', editData.repeat_days.includes(idx) ? 'bg-[var(--color-text)] text-[var(--bg-card)] border-[var(--color-text)]' : 'bg-[var(--bg-secondary)] text-[var(--color-secondary)] border-[var(--color-border)] hover:border-[var(--color-secondary)]']">
                        <input type="checkbox" :value="idx" v-model="editData.repeat_days" class="hidden">
                        {{ day }}
                    </label>
                </div>

                <div v-if="editData.completed">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_task.completed_at') }}</label>
                    <input v-model="editData.completed_at" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                </div>

                <button @click="handleSave" class="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm shadow-sm hover:opacity-80 active:scale-[0.98] transition-all mt-4">{{ $t('common.save') }}</button>
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
    if (el) {
        el.style.height = 'auto';
        el.style.height = el.scrollHeight + 'px';
    }
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
            await axios.post('tasks', payload);
        } else {
            // Method Spoofing: Use POST to bypass Apache PUT blocking
            payload._method = 'PUT';
            await axios.post(`tasks/${props.task.id}`, payload);
        }
        
        await store.fetchAll();
        emit('saved');
        emit('close');
    } catch (e) {
        alert(t('edit_task.save_error'));
    }
};

onMounted(() => {
    setTimeout(autoResize, 50);
});
</script>
