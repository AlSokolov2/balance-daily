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
    <div v-else class="app-container w-full max-w-[1600px] mx-auto flex flex-col h-[100dvh] p-2 sm:p-4 overflow-hidden relative">
        <header v-if="!isHandheld" class="flex justify-between items-center px-1 py-2 shrink-0 z-50">
            <h1 class="text-xl sm:text-2xl font-bold text-[#1c1c1e]">
                Баланс.Дейли
            </h1>
            
            <div class="flex items-center gap-2 relative">
                <button @click="showTaskList = !showTaskList" class="text-xs sm:text-sm font-medium text-blue-600 bg-blue-50 px-3 py-1.5 rounded-xl hover:bg-blue-100 transition-colors">
                    {{ showTaskList ? 'Скрыть список' : 'Список задач' }}
                </button>
                <div v-if="store.user" class="flex items-center gap-2 cursor-pointer ml-1 sm:ml-2" @click="isMenuOpen = !isMenuOpen">
                    <img :src="store.user.avatar" class="w-8 h-8 rounded-full border border-gray-200 object-cover" referrerpolicy="no-referrer" :title="store.user.name">
                    <span class="text-sm font-medium">{{ store.user.name }}</span>
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <!-- Выпадающее меню (Desktop) -->
                <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden z-50">
                    <button @click="openSettings" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                        <span>⚙️</span> Настройки
                    </button>
                    <button @click="handleLogout" class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100">
                        <span>🚪</span> Выйти
                    </button>
                </div>
            </div>
        </header>

        <!-- Overlay для закрытия меню по клику снаружи -->
        <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>

        <!-- Форма добавления (Desktop only) -->
        <div v-if="!isHandheld" class="flex items-center gap-2 mb-3 px-1 shrink-0 z-10 relative">
            <input v-model="newTask.title" placeholder="Что нужно сделать?" @keyup.enter="addTask" class="flex-1 p-[12px_16px] rounded-2xl border border-[#e5e5ea] shadow-sm text-[15px] outline-none focus:ring-2 focus:ring-blue-500 transition-all bg-white">
            <button @click="openAdvancedAdd" class="p-[12px] bg-blue-100 text-blue-600 rounded-2xl font-bold shadow-sm hover:bg-blue-200 transition-colors w-[46px] h-[46px] flex items-center justify-center shrink-0" title="Расширенное добавление">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
        </div>

        <!-- Фильтры (Desktop only) -->
        <div v-if="!isHandheld" class="px-1 mb-3 shrink-0">
            <div class="flex gap-2 overflow-x-auto pb-1 scrollbar-hide snap-x">
                <div @click="store.filterCat = 'all'" 
                     :class="['whitespace-nowrap px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all snap-start shadow-sm', store.filterCat === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']">
                    Все ({{ store.bubbleTasks.length }})
                </div>
                <div v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug"
                     @click="store.filterCat = cat.slug"
                     :class="['whitespace-nowrap px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all snap-start shadow-sm', store.filterCat === cat.slug ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']">
                    {{ cat.name }}
                </div>
                <div @click="store.filterCat = 'hidden'"
                     :class="['whitespace-nowrap px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all snap-start shadow-sm', store.filterCat === 'hidden' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']">
                    Скрытые
                </div>
                <div @click="store.filterCat = 'archive'"
                     :class="['whitespace-nowrap px-4 py-2 rounded-xl cursor-pointer text-sm font-medium transition-all snap-start shadow-sm', store.filterCat === 'archive' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50']">
                    Архив
                </div>
            </div>
        </div>

        <!-- Контент свайпа (Handheld: Chart <-> List, Desktop: Just content) -->
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden pt-1 handheld:pt-0">
            <!-- Mobile/Handheld Swipe View -->
            <div v-if="isHandheld" class="flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth" @scroll="handleMobileScroll">
                <!-- Screen 1: Bubble Chart -->
                <div class="min-w-full h-full snap-start p-1 flex flex-col">
                    <div class="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col min-h-0 min-w-0">
                        <BubbleChart @edit="handleEdit" class="flex-1 w-full h-full" />
                    </div>
                </div>
                <!-- Screen 2: Task List -->
                <div class="min-w-full h-full snap-start p-1 flex flex-col">
                    <div class="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 overflow-y-auto p-3">
                        <div v-if="!store.filteredTasks.length" class="text-center py-12 text-[#8e8e93] text-sm">
                            Нет задач в этой категории
                        </div>
                        <TaskItem v-for="task in store.filteredTasks" 
                                  :key="task.id" 
                                  :task="task"
                                  @edit="handleEdit"
                                  @delete="deleteTask" />
                    </div>
                </div>
            </div>

            <!-- Desktop View -->
            <div v-else class="flex-1 flex flex-col h-full gap-3">
                <!-- Визуализация -->
                <div class="flex-1 bg-white rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden flex flex-col min-h-0 min-w-0">
                    <BubbleChart @edit="handleEdit" class="flex-1 w-full h-full" />
                </div>

                <!-- Список задач (Desktop toggleable) -->
                <div v-if="showTaskList" class="card bg-white rounded-[16px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[#e5e5ea] min-h-[100px] overflow-y-auto shrink-0 max-h-[30vh]">
                    <div v-if="!store.filteredTasks.length" class="text-center py-8 text-[#8e8e93] text-sm">
                        Нет задач
                    </div>
                    <TaskItem v-for="task in store.filteredTasks" 
                              :key="task.id" 
                              :task="task"
                              @edit="handleEdit"
                              @delete="deleteTask" />
                </div>
            </div>
        </div>

        <!-- Нижняя панель управления (Handheld) -->
        <div v-if="isHandheld" 
             class="flex items-center gap-2 py-3 px-2 shrink-0 z-[60] bg-[#f5f5f7]/50 backdrop-blur-md">
            
            <!-- Фильтр (Слева) -->
            <div class="flex-1 min-w-0 relative">
                <select v-model="store.filterCat" class="w-full bg-white border border-[#e5e5ea] p-2.5 rounded-xl text-xs font-bold text-gray-700 outline-none appearance-none shadow-sm">
                    <option value="all">Все ({{ store.bubbleTasks.length }})</option>
                    <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">
                        {{ cat.name }}
                    </option>
                    <option value="hidden">Скрытые</option>
                    <option value="archive">Архив</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            <!-- Пагинация (Центр) -->
            <div class="flex gap-1 px-1">
                <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentMobileScreen === 0 ? 'bg-blue-600 w-3' : 'bg-gray-300']"></div>
                <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentMobileScreen === 1 ? 'bg-blue-600 w-3' : 'bg-gray-300']"></div>
            </div>

            <!-- Управление (Справа: FAB + Avatar) -->
            <div class="flex items-center gap-2 relative">
                <button @click="openAdvancedAdd" class="w-11 h-11 bg-blue-600 text-white rounded-xl shadow-md flex items-center justify-center active:scale-90 transition-transform shrink-0">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
                
                <div v-if="store.user" class="relative">
                    <img :src="store.user.avatar" @click="isMenuOpen = !isMenuOpen" 
                         class="w-11 h-11 rounded-xl border border-white shadow-sm object-cover cursor-pointer active:scale-90 transition-transform" 
                         referrerpolicy="no-referrer">
                    
                    <!-- Выпадающее меню (Handheld - открывается вверх) -->
                    <div v-if="isMenuOpen" class="absolute right-0 bottom-full mb-3 w-52 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-[70]">
                        <div class="px-4 py-3 bg-gray-50 border-b border-gray-100">
                            <div class="text-xs font-bold text-gray-900 truncate">{{ store.user.name }}</div>
                            <div class="text-[10px] text-gray-500 truncate">{{ store.user.email }}</div>
                        </div>
                        <button @click="openSettings" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <span>⚙️</span> Настройки
                        </button>
                        <button @click="store.fetchAll" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-50">
                            <span>🔄</span> Обновить данные
                        </button>
                        <button @click="resetDay" class="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2">
                            <span>☀️</span> Новый день (сброс)
                        </button>
                        <button @click="handleLogout" class="w-full text-left px-4 py-3 text-sm text-red-600 hover:bg-gray-50 flex items-center gap-2 border-t border-gray-100">
                            <span>🚪</span> Выйти
                        </button>
                    </div>
                </div>
            </div>
        </div>

        <!-- Плавающая панель (Desktop only) -->
        <div v-if="!isHandheld" class="action-bar sticky bottom-3 bg-white/90 backdrop-blur-[20px] p-2 rounded-[24px] flex items-center gap-3 border border-[#e5e5ea] shadow-sm z-50 shrink-0">
            <div class="flex items-center gap-1 bg-gray-100/50 p-1 rounded-2xl shrink-0">
                <button @click="store.bubbleZoom = Math.max(0.5, store.bubbleZoom - 0.1)" class="w-9 h-9 rounded-xl bg-white text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 font-bold text-lg active:scale-95 transition-transform">-</button>
                <button @click="store.bubbleZoom = 1" class="w-[42px] text-[11px] font-bold text-gray-500 text-center hover:text-gray-700 active:scale-95 transition-transform" title="Сбросить масштаб">
                    {{ store.bubbleZoom.toFixed(1) }}x
                </button>
                <button @click="store.bubbleZoom = Math.min(2, store.bubbleZoom + 0.1)" class="w-9 h-9 rounded-xl bg-white text-gray-600 shadow-sm flex items-center justify-center hover:bg-gray-50 font-bold text-lg active:scale-95 transition-transform">+</button>
            </div>
            <div class="flex gap-2 flex-1 min-w-0">
                <button @click="store.fetchAll" class="secondary flex-1 py-3 rounded-2xl text-[14px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform min-w-0" title="Обновить">
                    <svg class="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                    <span>Обновить</span>
                </button>
                <button @click="resetDay" class="secondary flex-1 py-3 rounded-2xl text-[14px] font-semibold active:scale-95 transition-transform truncate min-w-0">Новый день</button>
            </div>
        </div>
        
        <!-- Модальные окна -->
        <EditTaskModal v-if="editingTask" :task="editingTask" :isNew="editingTask.isNew" @close="editingTask = null" />
        <SettingsModal v-if="showSettingsModal" @close="showSettingsModal = false" />
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useBalanceStore } from './stores/balance';
import BubbleChart from './components/BubbleChart.vue';
import TaskItem from './components/TaskItem.vue';
import EditTaskModal from './components/EditTaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';

const store = useBalanceStore();
const weekdays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
const showSettingsModal = ref(false);
const isMenuOpen = ref(false);
const showTaskList = ref(false);
const editingTask = ref(null);
const isInitializing = ref(true);
const currentMobileScreen = ref(0);
const isLandscape = ref(window.innerWidth > window.innerHeight);
const isHandheld = ref(false);

const updateDimensions = () => {
    isLandscape.value = window.innerWidth > window.innerHeight;
    const isTouch = (navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
    // Handheld if touch device OR very small screen
    isHandheld.value = isTouch || window.innerWidth < 640;
};

onMounted(() => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
});

onUnmounted(() => {
    window.removeEventListener('resize', updateDimensions);
});

const handleMobileScroll = (e) => {
    const scrollLeft = e.target.scrollLeft;
    const width = e.target.clientWidth;
    currentMobileScreen.value = Math.round(scrollLeft / width);
};

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

const openAdvancedAdd = () => {
    editingTask.value = { ...newTask.value, isNew: true };
    // Clear input after opening
    newTask.value.title = '';
};

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
