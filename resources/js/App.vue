<template>
    <!-- Состояние загрузки сессии -->
    <div v-if="isInitializing" class="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div class="text-[var(--color-primary)] font-bold animate-pulse text-lg text-center">
            {{ $t('auth.loading_app') }}
        </div>
    </div>

    <!-- Экран входа -->
    <AuthScreen v-else-if="!store.isAuthenticated" />

    <!-- Основное приложение -->
    <div v-else class="app-container w-full max-w-[1600px] mx-auto flex flex-col h-[100dvh] p-2 sm:p-4 overflow-hidden relative bg-[var(--bg-app)]">
        
        <!-- Desktop Header & Controls -->
        <template v-if="!isHandheld">
            <AppHeader 
                v-model="store.searchQuery"
                :isSearchVisible="isSearchVisible"
                :showTaskList="showTaskList"
                :isMenuOpen="isMenuOpen"
                @toggle-search="toggleSearch"
                @toggle-list="showTaskList = !showTaskList"
                @toggle-menu="isMenuOpen = !isMenuOpen"
                @logout="handleLogout"
                @open-settings="openSettings"
                @open-stats="openStats"
            />
            <DesktopAddForm @open-advanced="openAdvancedAdd" />
            <DesktopFilterBar />
        </template>

        <!-- Main Content -->
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden pt-1 handheld:pt-0">
            <!-- Mobile/Handheld Swipe View -->
            <div v-if="isHandheld" ref="mobileScrollContainer" class="mobile-scroll-container flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth" @scroll="handleMobileScroll">
                <!-- Screen 1: Bubble Chart Stack (скрывается для архива/скрытых) -->
                <div v-if="store.filterCat !== 'archive' && store.filterCat !== 'hidden'" class="min-w-full h-full snap-start p-1 flex flex-col">
                    <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0">
                        <div class="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide scroll-smooth h-full" ref="verticalChartContainer">
                            <!-- Plans -->
                            <div class="h-full w-full snap-start relative">
                                <BubbleChart :tasks="store.plansTasks" mode="single" @edit="handleEdit" class="w-full h-full" />
                                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                    {{ $t('app.sections.plans') }} ↓
                                </div>
                            </div>
                            <!-- Focus -->
                            <div class="h-full w-full snap-start relative" id="mobile-focus-chart">
                                <BubbleChart :tasks="store.focusTasks" mode="single" @edit="handleEdit" class="w-full h-full" />
                                <div class="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                    ↑ {{ $t('app.sections.plans') }}
                                </div>
                                <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                    {{ $t('app.sections.routine') }} ↓
                                </div>
                            </div>
                            <!-- Routine -->
                            <div class="h-full w-full snap-start relative">
                                <BubbleChart :tasks="store.routineTasks" mode="single" @edit="handleEdit" class="w-full h-full" />
                                <div class="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                    ↑ {{ $t('app.sections.routine') }}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Screen 2: Task List -->
                <div class="min-w-full h-full snap-start p-1 flex flex-col relative overflow-hidden">
                    <!-- Pull indicator -->
                    <div class="absolute top-0 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-300"
                         :style="{ height: pullDistance + 'px', opacity: pullDistance > 10 ? 1 : 0 }">
                        <div class="mt-2 w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--color-border)] shadow-md flex items-center justify-center overflow-hidden">
                            <div v-if="!isRefreshing" class="text-[var(--color-primary)] transition-transform duration-200"
                                 :style="{ transform: `rotate(${pullDistance * 3}deg)` }">↓</div>
                            <div v-else class="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin"></div>
                        </div>
                    </div>

                    <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] flex flex-col overflow-hidden transition-transform duration-200 ease-out task-list-container"
                         :style="{ transform: `translateY(${pullDistance}px)` }"
                         @touchstart="handleTouchStartPull"
                         @touchmove="handleTouchMovePull"
                         @touchend="handleTouchEndPull">
                        <div class="flex-1 overflow-y-auto p-3">
                            <div v-if="!store.filteredTasks.length" class="text-center py-12 text-[var(--color-secondary)] text-sm">
                                {{ $t('app.no_tasks_in_category') }}
                            </div>
                            <TaskItem v-for="task in store.filteredTasks" 
                                      :key="task.id" 
                                      :task="task"
                                      @edit="handleEdit"
                                      @delete="deleteTask" />
                        </div>
                    </div>
                </div>
            </div>

            <!-- Desktop Content -->
            <div v-else class="flex-1 flex flex-col h-full gap-3">
                <!-- Диаграмма (скрывается для архива/скрытых) -->
                <div v-if="store.filterCat !== 'archive' && store.filterCat !== 'hidden'" 
                     class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0">
                    <BubbleChart @edit="handleEdit" class="flex-1 w-full h-full" />
                </div>

                <!-- Список задач (разворачивается на весь экран для архива/скрытых) -->
                <div v-if="showTaskList" 
                     :class="{ 'flex-1 max-h-none': store.filterCat === 'archive' || store.filterCat === 'hidden' }"
                     class="card bg-[var(--bg-card)] rounded-[16px] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[var(--color-border)] min-h-[100px] shrink-0 max-h-[40vh] overflow-hidden">
                    <div class="flex-1 overflow-y-auto p-4">
                        <div v-if="!store.filteredTasks.length" class="text-center py-8 text-[var(--color-secondary)] text-sm">
                            {{ $t('app.no_tasks') }}
                        </div>
                        <TaskItem v-for="task in store.filteredTasks" :key="task.id" :task="task" @edit="handleEdit" @delete="deleteTask" />
                    </div>
                </div>
                
                <!-- Zoom Controls -->
                <div class="absolute bottom-4 right-4 flex items-center gap-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm z-10">
                    <button @click="store.bubbleZoom = Math.max(0.5, store.bubbleZoom - 0.1)" class="zoom-btn">-</button>
                    <button @click="store.bubbleZoom = 1" class="px-2 text-[10px] font-bold text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors min-w-[36px] text-center">
                        {{ store.bubbleZoom.toFixed(1) }}x
                    </button>
                    <button @click="store.bubbleZoom = Math.min(2, store.bubbleZoom + 0.1)" class="zoom-btn">+</button>
                </div>
            </div>
        </div>

        <!-- Mobile Navigation -->
        <MobileBottomNav 
            v-if="isHandheld"
            :currentScreen="currentMobileScreen"
            :isMenuOpen="isMenuOpen"
            @toggle-search="toggleSearch"
            @open-advanced="openAdvancedAdd"
            @toggle-menu="isMenuOpen = !isMenuOpen"
            @logout="handleLogout"
            @open-settings="openSettings"
            @open-stats="openStats"
        />

        <!-- Overlays & Modals -->
        <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>

        <!-- Mobile Search Overlay -->
        <div v-if="isHandheld && isSearchVisible" class="fixed inset-x-2 bottom-20 z-[70] transition-all duration-300 transform animate-[slide-up_0.3s_ease-out]">
            <div class="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-2 flex items-center gap-2">
                <svg class="w-5 h-5 ml-2 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                <input ref="searchInputMobile" v-model="store.searchQuery" type="text" :placeholder="$t('app.search_placeholder')" class="flex-1 bg-transparent border-none outline-none text-[15px] p-2 text-[var(--color-text)]">
                <button @click="toggleSearch" class="p-2 text-[var(--color-secondary)] border-none bg-transparent">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
            </div>
        </div>

        <EditTaskModal v-if="editingTask" :task="editingTask" :isNew="editingTask.isNew" @close="editingTask = null" />
        <SettingsModal v-if="showSettingsModal" :offlineReady="isActuallyOfflineReady" @close="showSettingsModal = false" />
        <StatsModal v-if="showStatsModal" @close="showStatsModal = false" />

        <!-- PWA Update Notification -->
        <div v-if="needRefresh" @click="updateServiceWorker(true)" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] cursor-pointer group">
            <div class="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 animate-[slide-up_0.3s_ease-out] hover:scale-105 transition-all active:scale-95">
                <div class="w-6 h-6 rounded-full bg-[var(--btn-primary-bg)] flex items-center justify-center text-[10px] shrink-0 shadow-sm">🚀</div>
                <span class="text-xs font-bold text-[var(--color-text)] pr-1">{{ $t('pwa.update_available') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useBalanceStore } from './stores/balance';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useI18n } from 'vue-i18n';

// Components
import BubbleChart from './components/BubbleChart.vue';
import TaskItem from './components/TaskItem.vue';
import EditTaskModal from './components/EditTaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import AuthScreen from './components/AuthScreen.vue';
import AppHeader from './components/AppHeader.vue';
import DesktopFilterBar from './components/DesktopFilterBar.vue';
import DesktopAddForm from './components/DesktopAddForm.vue';
import MobileBottomNav from './components/MobileBottomNav.vue';
import StatsModal from './components/StatsModal.vue';

const { locale, t } = useI18n();
const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

const store = useBalanceStore();
const isInitializing = ref(true);
const isActuallyOfflineReady = ref(false);
const isRefreshing = ref(false);
const showTaskList = ref(false);
const showSettingsModal = ref(false);
const showStatsModal = ref(false);
const isMenuOpen = ref(false);
const isSearchVisible = ref(false);
const currentMobileScreen = ref(0);
const isHandheld = ref(false);
const editingTask = ref(null);

// Refs for scrolling and focus
const mobileScrollContainer = ref(null);
const verticalChartContainer = ref(null);
const searchInputMobile = ref(null);

// Watchers
watch(() => offlineReady.value, (val) => { if (val) isActuallyOfflineReady.value = true; }, { immediate: true });
watch(() => store.locale, (newLocale) => { if (newLocale) locale.value = String(newLocale); }, { immediate: true });
watch(() => store.filterCat, (newCat) => {
    if (newCat === 'archive' || newCat === 'hidden') {
        showTaskList.value = true;
        scrollToList();
    } else {
        showTaskList.value = false;
    }
});

// Layout Detection
const updateDimensions = () => {
    const isTouch = (navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
    isHandheld.value = isTouch || window.innerWidth < 640;
};

// Handlers
const handleLogout = () => { isMenuOpen.value = false; store.logout(); };
const openSettings = () => { isMenuOpen.value = false; showSettingsModal.value = true; };
const openStats = () => { isMenuOpen.value = false; showStatsModal.value = true; };
const toggleSearch = () => {
    isSearchVisible.value = !isSearchVisible.value;
    if (isSearchVisible.value) {
        nextTick(() => { searchInputMobile.value?.focus(); });
    } else {
        store.searchQuery = '';
    }
};

const handleEdit = (task) => { editingTask.value = task; };
const openAdvancedAdd = () => {
    editingTask.value = { 
        title: '', category_slug: 'chor', importance: 2, repeat_type: 'none', 
        repeat_interval: 1, repeat_days: [], deadline: '', postpone_until: '', 
        ha: false, force_active: false, notes: '', isNew: true 
    };
};

const deleteTask = async (id) => {
    if (confirm(t('app.alerts.delete_confirm'))) {
        try { await store.deleteTask(id); } catch (e) { alert(t('app.alerts.delete_error')); }
    }
};

// Mobile Navigation & Scroll
const handleMobileScroll = (e) => {
    currentMobileScreen.value = Math.round(e.target.scrollLeft / e.target.clientWidth);
};

const scrollToList = () => {
    if (isHandheld.value && mobileScrollContainer.value) {
        nextTick(() => { mobileScrollContainer.value.scrollLeft = mobileScrollContainer.value.clientWidth; });
    }
};

// Pull-to-refresh
const pullDistance = ref(0);
const startY = ref(0);
const isPulling = ref(false);

const handleTouchStartPull = (e) => {
    if (e.currentTarget.scrollTop <= 0) {
        startY.value = e.touches[0].clientY;
        isPulling.value = true;
    }
};

const handleTouchMovePull = (e) => {
    if (!isPulling.value) return;
    const diff = e.touches[0].clientY - startY.value;
    if (diff > 0) {
        pullDistance.value = Math.pow(diff, 0.85);
        if (pullDistance.value > 10 && e.cancelable) e.preventDefault();
    } else {
        pullDistance.value = 0;
        isPulling.value = false;
    }
};

const handleTouchEndPull = async () => {
    if (isPulling.value && pullDistance.value > 60 && !isRefreshing.value) {
        isRefreshing.value = true;
        try { await store.fetchAll(); } finally { isRefreshing.value = false; }
    }
    pullDistance.value = 0;
    isPulling.value = false;
};

// Lifecycle
onMounted(async () => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) isActuallyOfflineReady.value = true;
    
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (store.theme === 'system') store.applyTheme();
    });

    await store.init();
    locale.value = store.locale;
    isInitializing.value = false;

    nextTick(() => {
        if (verticalChartContainer.value) verticalChartContainer.value.scrollTop = verticalChartContainer.value.clientHeight;
    });
});

onUnmounted(() => { window.removeEventListener('resize', updateDimensions); });

defineExpose({ isHandheld, isInitializing, scrollToList });
</script>

<style>
@reference "../css/app.css";

button {
    @apply transition-all duration-200 cursor-pointer font-bold border border-[var(--color-border)];
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
}
button:hover {
    @apply opacity-80;
    background: var(--bg-secondary);
    border-color: var(--color-secondary);
}
.zoom-btn {
    @apply w-8 h-8 rounded-xl bg-[var(--bg-card)] text-[var(--color-text)] flex items-center justify-center text-lg active:scale-95 border border-[var(--color-border)];
}
input[type="range"] { accent-color: var(--color-text); }
</style>
