<template>
    <div class="app-container max-w-[650px] mx-auto">
        <h1 class="text-2xl font-bold mb-2 flex justify-between items-center px-1">
            Баланс.Дейли 
            <button @click="showSettingsModal = true" class="secondary text-sm px-3 py-1.5 rounded-lg">Настройки</button>
        </h1>

        <!-- Форма добавления -->
        <div class="card bg-white rounded-[16px] p-4 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e5ea]">
            <input v-model="newTask.title" placeholder="Что сделать?" @keyup.enter="addTask" class="w-full p-[10px_12px] rounded-10 border border-[#c6c6c8] mb-1.5 text-[15px] outline-none">
            
            <div class="row flex gap-1.5 items-center flex-wrap mb-1.5">
                <select v-model="newTask.category_slug" class="flex-1 p-[10px_12px] rounded-10 border border-[#c6c6c8] text-[15px] bg-white outline-none min-w-[120px]">
                    <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">{{ cat.name }}</option>
                </select>
                <select v-model="newTask.importance" class="flex-1 p-[10px_12px] rounded-10 border border-[#c6c6c8] text-[15px] bg-white outline-none min-w-[120px]">
                    <option value="4">Очень высокая</option>
                    <option value="3">Высокая</option>
                    <option value="2">Средняя</option>
                    <option value="1">Низкая</option>
                    <option value="0.5">Очень низкая</option>
                </select>
            </div>

            <div class="row flex gap-1.5 items-center flex-wrap mb-1.5 text-xs text-gray-400">
                <input v-model="newTask.subcategory" list="subcat-list" placeholder="Подкатегория" class="flex-[2] p-2 rounded-10 border border-[#c6c6c8] outline-none">
                <datalist id="subcat-list"><option v-for="s in store.allSubcats" :key="s" :value="s"></option></datalist>
                <label>Дедлайн:</label>
                <input type="datetime-local" v-model="newTask.deadline" class="flex-[2] p-2 rounded-10 border border-[#c6c6c8] outline-none">
            </div>

            <div class="row flex gap-1.5 items-center flex-wrap mb-1.5 text-xs text-gray-400">
                <label>Отложить до:</label>
                <input type="datetime-local" v-model="newTask.postpone_until" class="flex-[2] p-2 rounded-10 border border-[#c6c6c8] outline-none">
                <select v-model="newTask.repeat_type" class="flex-1 p-2 rounded-10 border border-[#c6c6c8] bg-white outline-none">
                    <option value="none">Без повтора</option>
                    <option value="interval">Каждые N дней</option>
                    <option value="weekly">По дням недели</option>
                </select>
            </div>

            <div v-if="newTask.repeat_type === 'interval'" class="row flex gap-1.5 items-center mb-1.5 text-xs">
                <label>Дней:</label>
                <input type="number" v-model.number="newTask.repeat_interval" min="1" class="w-20 p-2 rounded-10 border border-[#c6c6c8] outline-none">
            </div>

            <div v-if="newTask.repeat_type === 'weekly'" class="row flex gap-1.5 items-center mb-1.5 text-xs flex-wrap">
                <div class="flex gap-2">
                    <label v-for="(day, idx) in weekdays" :key="idx" class="flex items-center gap-1">
                        <input type="checkbox" :value="idx" v-model="newTask.repeat_days"> {{ day }}
                    </label>
                </div>
            </div>

            <div class="row flex gap-3 items-center mb-1.5 text-xs text-gray-400">
                <label class="flex items-center gap-1">HA <input type="checkbox" v-model="newTask.ha"></label>
                <label class="flex items-center gap-1">Актуально <input type="checkbox" v-model="newTask.force_active"></label>
                <label>Заметка:</label>
            </div>
            
            <textarea v-model="newTask.notes" placeholder="Мини-заметка..." class="w-full p-[10px_12px] rounded-10 border border-[#c6c6c8] mb-1.5 text-[15px] h-10 resize-none outline-none"></textarea>

            <button @click="addTask" class="w-full p-[10px_12px] bg-[#007aff] text-white rounded-10 font-semibold text-[15px] cursor-pointer hover:opacity-90 active:scale-[0.98] transition-all">Добавить</button>
        </div>

        <!-- Визуализация -->
        <div class="card bg-white rounded-[16px] p-4 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e5ea]">
            <h3 class="text-base font-semibold mb-2 flex justify-between items-center">
                Приоритеты ({{ store.bubbleTasks.length }})
                <div class="flex items-center gap-2">
                    <button @click="store.fetchAll" class="secondary text-xs px-2 py-1 rounded">Обновить</button>
                    <input type="range" v-model.number="store.bubbleZoom" min="0.5" max="2" step="0.1" class="w-20">
                    <span class="text-[12px] text-gray-500 w-8">{{ store.bubbleZoom.toFixed(1) }}x</span>
                </div>
            </h3>
            <BubbleChart />
        </div>

        <!-- Фильтры -->
        <div class="filter-tabs flex gap-[3px] mb-3 bg-[#f2f2f7] p-[3px] rounded-10 flex-wrap">
            <div @click="store.filterCat = 'all'" 
                 :class="['filter-tab flex-1 text-center py-[6px] rounded-8 cursor-pointer text-[12px] transition-all', store.filterCat === 'all' ? 'active bg-white font-semibold' : '']">
                Все
            </div>
            <div v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug"
                 @click="store.filterCat = cat.slug"
                 :class="['filter-tab flex-1 text-center py-[6px] rounded-8 cursor-pointer text-[12px] transition-all', store.filterCat === cat.slug ? 'active bg-white font-semibold' : '']">
                {{ cat.name }}
            </div>
            <div @click="store.filterCat = 'archive'"
                 :class="['filter-tab flex-1 text-center py-[6px] rounded-8 cursor-pointer text-[12px] transition-all', store.filterCat === 'archive' ? 'active bg-white font-semibold' : '']">
                Архив
            </div>
            <div @click="store.filterCat = 'hidden'"
                 :class="['filter-tab flex-1 text-center py-[6px] rounded-8 cursor-pointer text-[12px] transition-all', store.filterCat === 'hidden' ? 'active bg-white font-semibold' : '']">
                Скрытые
            </div>
        </div>

        <!-- Список задач -->
        <div class="card bg-white rounded-[16px] p-4 mb-3 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e5ea] min-h-[100px]">
            <div v-if="!store.filteredTasks.length" class="text-center py-8 text-[#8e8e93] text-sm">
                Нет задач
            </div>
            <TaskItem v-for="task in store.filteredTasks" 
                      :key="task.id" 
                      :task="task"
                      @edit="handleEdit"
                      @delete="deleteTask" />
        </div>

        <!-- Плавающая панель -->
        <div class="action-bar sticky bottom-3 bg-white/90 backdrop-blur-[20px] p-[10px] rounded-[20px] flex gap-2 border border-[#e5e5ea] shadow-sm z-50">
            <button @click="store.recalculateAll" class="secondary flex-1 py-2 rounded-10 text-[15px]">Обновить</button>
            <button @click="resetDay" class="secondary flex-1 py-2 rounded-10 text-[15px]">Новый день</button>
        </div>
        
        <!-- Модальные окна -->
        <EditTaskModal v-if="editingTask" :task="editingTask" @close="editingTask = null" />
        <SettingsModal v-if="showSettingsModal" @close="showSettingsModal = false" />
    </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useBalanceStore } from './stores/balance';
import BubbleChart from './components/BubbleChart.vue';
import TaskItem from './components/TaskItem.vue';
import EditTaskModal from './components/EditTaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';

const store = useBalanceStore();
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const showSettingsModal = ref(false);
const editingTask = ref(null);

const newTask = ref({
    title: '',
    category_slug: 'chor',
    importance: 2,
    subcategory: '',
    deadline: '',
    postpone_until: '',
    repeat_type: 'none',
    repeat_interval: 1,
    repeat_days: [],
    ha: false,
    force_active: false,
    notes: '',
});

const addTask = async () => {
    if (!newTask.value.title) return;
    try {
        await store.addTask({ ...newTask.value });
        newTask.value = {
            title: '',
            category_slug: 'chor',
            importance: 2,
            subcategory: '',
            deadline: '',
            postpone_until: '',
            repeat_type: 'none',
            repeat_interval: 1,
            repeat_days: [],
            ha: false,
            force_active: false,
            notes: '',
        };
    } catch (error) {
        alert('Ошибка при добавлении задачи.');
    }
};

const deleteTask = async (id) => {
    if (confirm('Удалить задачу?')) {
        try {
            await store.deleteTask(id);
        } catch (error) {
            alert('Ошибка при удалении задачи.');
        }
    }
};

const handleEdit = (task) => {
    editingTask.value = task;
};

const resetDay = async () => {
    if (confirm('Сбросить счетчики дня? (Симуляция "Нового дня")')) {
        store.categories.forEach(c => {
            c.completedCount = 0; 
        });
        store.recalculateAll();
    }
};

onMounted(() => {
    store.fetchAll();
});
</script>

<style>
/* Utilities specifically for reference match */
.rounded-10 { border-radius: 10px; }
.rounded-8 { border-radius: 8px; }

button {
    background: #007aff;
    color: white;
    border: none;
    font-weight: 600;
    cursor: pointer;
}
button.secondary {
    background: #e5e5ea;
    color: #007aff;
}
input[type="range"] {
    accent-color: #007aff;
}
</style>
