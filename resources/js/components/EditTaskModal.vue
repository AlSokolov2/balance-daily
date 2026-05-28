<template>
    <div class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 w-full max-w-md shadow-2xl relative max-h-[90vh] overflow-y-auto overflow-x-hidden border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-[var(--color-text)]">{{ isNew ? 'Новая задача' : 'Редактировать' }}</h2>
                <div v-if="!isNew" class="flex items-center gap-2 mr-auto ml-2 sm:ml-5">
                    <span class="text-sm font-semibold text-[var(--color-text)]">Выполнено</span>
                    <input type="checkbox" v-model="editData.completed" class="w-5 h-5 rounded-lg accent-[var(--color-text)]">
                </div>
                <span @click="$emit('close')" class="cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors">&times;</span>
            </div>

            <div class="space-y-3">
                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Заголовок</label>
                    <input v-model="editData.title" type="text" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                </div>

                <div>
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Заметка</label>
                    <textarea v-model="editData.notes" @input="autoResize" ref="notesTextarea" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm h-20 resize-none focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)]/50 text-[var(--color-text)]" placeholder="Заметка к задаче"></textarea>
                </div>

                <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Категория</label>
                        <select v-model="editData.category_slug" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--color-text)]">
                            <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
                        </select>
                    </div>
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Важность</label>
                        <select v-model="editData.importance" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm bg-[var(--bg-secondary)] text-[var(--color-text)]">
                            <option value="4">Очень высокая</option>
                            <option value="3">Высокая</option>
                            <option value="2">Средняя</option>
                            <option value="1">Низкая</option>
                            <option value="0.5">Очень низкая</option>
                        </select>
                    </div>
                </div>

                <div class="min-w-0">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Подкатегория</label>
                    <input v-model="editData.subcategory" list="subcat-list-edit" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    <datalist id="subcat-list-edit"><option v-for="s in store.allSubcats" :key="s" :value="s"></option></datalist>
                </div>

                <div class="flex flex-col sm:grid sm:grid-cols-2 gap-2">
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Дедлайн</label>
                        <input v-model="editData.deadline" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    </div>
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Отложить до</label>
                        <input v-model="editData.postpone_until" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    </div>
                </div>

                <div class="flex flex-wrap sm:flex-nowrap items-center gap-3 py-2 border-t border-b border-[var(--color-border)]">
                    <select v-model="editData.repeat_type" class="flex-1 p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                        <option value="none">Без повтора</option>
                        <option value="interval">Каждые N дней</option>
                        <option value="weekly">По дням недели</option>
                    </select>
                    <label class="flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)]">HA <input type="checkbox" v-model="editData.ha" class="accent-[var(--color-text)]"></label>
                    <label class="flex items-center gap-1 text-[11px] font-bold text-[var(--color-secondary)]">Актуально <input type="checkbox" v-model="editData.force_active" class="accent-[var(--color-text)]"></label>
                </div>

                <div v-if="editData.repeat_type === 'interval'" class="flex items-center gap-2 text-xs">
                    <label class="text-[var(--color-secondary)]">Каждые</label>
                    <input v-model.number="editData.repeat_interval" type="number" min="1" class="w-16 p-2 border border-[var(--color-border)] rounded-xl text-center bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    <label class="text-[var(--color-secondary)]">дней</label>
                </div>

                <div v-if="editData.repeat_type === 'weekly'" class="flex gap-1.5 flex-wrap">
                    <label v-for="(day, idx) in weekdays" :key="idx" :class="['px-2.5 py-1.5 border rounded-xl text-[10px] font-bold cursor-pointer transition-all', editData.repeat_days.includes(idx) ? 'bg-[var(--color-text)] text-[var(--bg-card)] border-[var(--color-text)]' : 'bg-[var(--bg-secondary)] text-[var(--color-secondary)] border-[var(--color-border)] hover:border-[var(--color-secondary)]']">
                        <input type="checkbox" :value="idx" v-model="editData.repeat_days" class="hidden">
                        {{ day }}
                    </label>
                </div>

                <div v-if="editData.completed">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">Дата выполнения</label>
                    <input v-model="editData.completed_at" type="datetime-local" class="w-full p-2 border border-[var(--color-border)] rounded-xl text-xs bg-[var(--bg-secondary)] text-[var(--color-text)]">
                </div>

                <button @click="handleSave" class="w-full py-3.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-2xl font-bold text-sm shadow-sm hover:opacity-80 active:scale-[0.98] transition-all mt-4">Сохранить</button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, reactive } from 'vue';
import { useBalanceStore } from '../stores/balance';
import axios from 'axios';

const props = defineProps({
    task: Object,
    isNew: {
        type: Boolean,
        default: false
    }
});
const emit = defineEmits(['close', 'saved']);
const store = useBalanceStore();
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
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
            await axios.put(`tasks/${props.task.id}`, payload);
        }
        
        await store.fetchAll();
        emit('saved');
        emit('close');
    } catch (e) {
        alert('Ошибка при сохранении задачи');
    }
};

onMounted(() => {
    setTimeout(autoResize, 50);
});
</script>
