<template>
    <!-- Состояние загрузки сессии -->
    <div v-if="isInitializing" class="min-h-screen flex items-center justify-center bg-[#f5f5f7]">
        <div class="text-[#007aff] font-bold animate-pulse text-lg text-center">
            Загрузка Баланс.Дейли...
        </div>
    </div>

    <!-- Экран входа (если не авторизован) -->
    <div v-else-if="!store.isAuthenticated" class="min-h-screen flex items-center justify-center bg-[#f5f5f7] p-4">
        <div class="card bg-white rounded-[24px] p-8 w-full max-w-sm shadow-[0_4px_24px_rgba(0,0,0,0.06)] border border-[#e5e5ea] text-center">
            <div class="w-16 h-16 bg-[#007aff] rounded-2xl mx-auto mb-6 flex items-center justify-center text-white text-3xl shadow-lg">⚖️</div>
            <h1 class="text-2xl font-bold text-[#1c1c1e] mb-2">Баланс.Дейли</h1>
            <p class="text-[#8e8e93] text-sm mb-8 leading-relaxed">
                Ваш персональный помощник для управления балансом жизни и задачами.
            </p>
            
            <button @click="loginWithGoogle" class="w-full py-3 bg-white border border-[#c6c6c8] text-[#1c1c1e] rounded-12 font-semibold text-[15px] flex items-center justify-center gap-3 hover:bg-gray-50 transition-all active:scale-[0.98]">
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.1h2.64c1.55-1.42 2.43-3.52 2.43-6.64z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.1c-.73.49-1.66.78-2.64.78-2.85 0-5.27-1.92-6.13-4.51H5.17v2.13A11.997 11.997 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.87 14.51c-.22-.66-.35-1.36-.35-2.01s.13-1.35.35-2.01V7.87H3.04C2.37 9.13 2 10.52 2 12s.37 2.87 1.04 4.13l2.83-2.12z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 4.15 3.13 3.04 6.22l2.83 2.12c.86-2.59 3.28-4.51 6.13-4.51z"/></svg>
                Войти через Google
            </button>
            
            <p class="mt-8 text-[11px] text-[#8e8e93]">
                Продолжая, вы соглашаетесь с условиями использования и политикой конфиденциальности.
            </p>
        </div>
    </div>

    <!-- Основное приложение (после входа) -->
    <div v-else class="app-container max-w-[650px] mx-auto">
        <h1 class="text-2xl font-bold mb-2 flex justify-between items-center px-1 pt-4 relative">
            Баланс.Дейли 
            <div class="flex items-center gap-2 relative">
                <div v-if="store.user" class="flex items-center gap-2 cursor-pointer" @click="isMenuOpen = !isMenuOpen">
                    <img :src="store.user.avatar" class="w-8 h-8 rounded-full border border-gray-200 object-cover" referrerpolicy="no-referrer" :title="store.user.name">
                    <span class="text-sm font-medium hidden sm:block">{{ store.user.name }}</span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <!-- Выпадающее меню -->
                <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <button @click="openSettings" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <span>⚙️</span> Настройки
                    </button>
                    <button @click="handleLogout" class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100">
                        <span>🚪</span> Выйти
                    </button>
                </div>
            </div>
        </h1>

        <!-- Overlay для закрытия меню по клику снаружи -->
        <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>

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
            <BubbleChart @edit="handleEdit" />
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
            <button @click="store.fetchAll" class="secondary flex-1 py-2 rounded-10 text-[15px]">Обновить</button>
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
const isMenuOpen = ref(false);
const editingTask = ref(null);
const isInitializing = ref(true);

const loginWithGoogle = () => {
    window.location.href = store.googleAuthUrl;
};

const handleLogout = () => {
    isMenuOpen.value = false;
    store.logout();
};

const openSettings = () => {
    isMenuOpen.value = false;
    showSettingsModal.value = true;
};

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

onMounted(async () => {
    await store.init();
    isInitializing.value = false;
});
</script>

<style>
/* Utilities specifically for reference match */
.rounded-10 { border-radius: 10px; }
.rounded-12 { border-radius: 12px; }
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
