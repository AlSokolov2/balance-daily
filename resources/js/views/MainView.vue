<template>
    <div class="flex-1 min-h-0 flex flex-col overflow-hidden pt-1 handheld:pt-0">
        <!-- Desktop Header & Controls (Moved from App.vue) -->
        <template v-if="!isHandheld">
            <AppHeader 
                v-model="store.searchQuery"
                :is-search-visible="isSearchVisible"
                :show-task-list="showTaskList"
                :is-menu-open="isMenuOpen"
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

        <!-- Mobile/Handheld Swipe View -->
        <div
            v-if="isHandheld"
            ref="mobileScrollContainer"
            class="mobile-scroll-container flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth"
            @scroll="handleMobileScroll"
        >
            <!-- Screen 1: Bubble Chart Stack -->
            <div v-if="store.filterCat !== 'archive' && store.filterCat !== 'hidden'" class="min-w-full h-full snap-start p-1 flex flex-col">
                <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0">
                    <div ref="verticalChartContainer" class="flex-1 overflow-y-auto snap-y snap-mandatory scrollbar-hide scroll-smooth h-full">
                        <!-- Plans -->
                        <div class="h-full w-full snap-start relative">
                            <BubbleChart
                                :tasks="store.plansTasks"
                                mode="single"
                                class="w-full h-full"
                                @edit="handleEdit"
                            />
                            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                {{ $t('app.sections.plans') }} ↓
                            </div>
                        </div>
                        <!-- Focus -->
                        <div id="mobile-focus-chart" class="h-full w-full snap-start relative">
                            <BubbleChart
                                :tasks="store.focusTasks"
                                mode="single"
                                class="w-full h-full"
                                @edit="handleEdit"
                            />
                            <div class="absolute top-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                ↑ {{ $t('app.sections.plans') }}
                            </div>
                            <div class="absolute bottom-4 left-1/2 -translate-x-1/2 pointer-events-none opacity-40 text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)]">
                                {{ $t('app.sections.routine') }} ↓
                            </div>
                        </div>
                        <!-- Routine -->
                        <div class="h-full w-full snap-start relative">
                            <BubbleChart
                                :tasks="store.routineTasks"
                                mode="single"
                                class="w-full h-full"
                                @edit="handleEdit"
                            />
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
                <div
                    class="absolute top-0 left-0 right-0 flex justify-center pointer-events-none transition-opacity duration-300"
                    :style="{ height: pullDistance + 'px', opacity: pullDistance > 10 ? 1 : 0 }"
                >
                    <div class="mt-2 w-8 h-8 rounded-full bg-[var(--bg-card)] border border-[var(--color-border)] shadow-md flex items-center justify-center overflow-hidden">
                        <div
                            v-if="!isRefreshing"
                            class="text-[var(--color-primary)] transition-transform duration-200"
                            :style="{ transform: `rotate(${pullDistance * 3}deg)` }"
                        >
                            ↓
                        </div>
                        <div v-else class="w-4 h-4 border-2 border-[var(--color-primary)] border-t-transparent rounded-full animate-spin" />
                    </div>
                </div>

                <div
                    class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] flex flex-col overflow-hidden transition-transform duration-200 ease-out task-list-container"
                    :style="{ transform: `translateY(${pullDistance}px)` }"
                    @touchstart="handleTouchStartPull"
                    @touchmove="handleTouchMovePull"
                    @touchend="handleTouchEndPull"
                >
                    <div class="flex-1 overflow-y-auto p-3">
                        <div v-if="!store.filteredTasks.length" class="text-center py-12 text-[var(--color-secondary)] text-sm">
                            {{ $t('app.no_tasks_in_category') }}
                        </div>
                        <TaskItem
                            v-for="task in store.filteredTasks" 
                            :key="task.id" 
                            :task="task"
                            @edit="handleEdit"
                            @delete="deleteTask"
                        />
                    </div>
                </div>
            </div>
        </div>

        <!-- Desktop Content -->
        <div v-else class="flex-1 flex flex-col h-full gap-3">
            <div
                v-if="store.filterCat !== 'archive' && store.filterCat !== 'hidden'" 
                class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0"
            >
                <BubbleChart class="flex-1 w-full h-full" @edit="handleEdit" />
            </div>

            <div
                v-if="showTaskList" 
                :class="{ 'flex-1 max-h-none': store.filterCat === 'archive' || store.filterCat === 'hidden' }"
                class="card bg-[var(--bg-card)] rounded-[16px] flex flex-col shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[var(--color-border)] min-h-[100px] shrink-0 max-h-[40vh] overflow-hidden"
            >
                <div class="flex-1 overflow-y-auto p-4">
                    <div v-if="!store.filteredTasks.length" class="text-center py-8 text-[var(--color-secondary)] text-sm">
                        {{ $t('app.no_tasks') }}
                    </div>
                    <TaskItem
                        v-for="task in store.filteredTasks"
                        :key="task.id"
                        :task="task"
                        @edit="handleEdit"
                        @delete="deleteTask"
                    />
                </div>
            </div>
            
            <!-- Zoom Controls -->
            <div class="absolute bottom-4 right-4 flex items-center gap-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm z-10">
                <button class="zoom-btn" @click="store.bubbleZoom = Math.max(0.5, store.bubbleZoom - 0.1)">
                    -
                </button>
                <button class="px-2 text-[10px] font-bold text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors min-w-[36px] text-center" @click="store.bubbleZoom = 1">
                    {{ store.bubbleZoom.toFixed(1) }}x
                </button>
                <button class="zoom-btn" @click="store.bubbleZoom = Math.min(2, store.bubbleZoom + 0.1)">
                    +
                </button>
            </div>
        </div>

        <!-- Mobile Search Overlay (Keep here as it's part of the Main Chart context) -->
        <div v-if="isHandheld && isSearchVisible" class="fixed inset-x-2 bottom-20 z-[70] transition-all duration-300 transform animate-[slide-up_0.3s_ease-out]">
            <div class="bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-2 flex items-center gap-2">
                <svg
                    class="w-5 h-5 ml-2 text-[var(--color-secondary)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2"
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                /></svg>
                <input
                    ref="searchInputMobile"
                    v-model="store.searchQuery"
                    type="text"
                    :placeholder="$t('app.search_placeholder')"
                    class="flex-1 bg-transparent border-none outline-none text-[15px] p-2 text-[var(--color-text)]"
                >
                <button class="p-2 text-[var(--color-secondary)] border-none bg-transparent" @click="toggleSearch">
                    <svg
                        class="w-6 h-6"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M6 18L18 6M6 6l12 12"
                    /></svg>
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, watch, nextTick, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import { useI18n } from 'vue-i18n';

// Components
import BubbleChart from '../components/BubbleChart.vue';
import TaskItem from '../components/TaskItem.vue';
import AppHeader from '../components/AppHeader.vue';
import DesktopFilterBar from '../components/DesktopFilterBar.vue';
import DesktopAddForm from '../components/DesktopAddForm.vue';

const props = defineProps({
    isHandheld: Boolean,
    offlineReady: Boolean
});

const { t } = useI18n();
const store = useBalanceStore();
const router = useRouter();

const isRefreshing = ref(false);
const showTaskList = ref(false);
const isMenuOpen = ref(false);
const isSearchVisible = ref(false);
const currentMobileScreen = ref(0);

const mobileScrollContainer = ref(null);
const verticalChartContainer = ref(null);
const searchInputMobile = ref(null);

watch(() => store.filterCat, (newCat) => {
    if (newCat === 'archive' || newCat === 'hidden') {
        showTaskList.value = true;
        scrollToList();
    } else {
        showTaskList.value = false;
    }
});

const handleLogout = () => { isMenuOpen.value = false; store.logout(); };

const openSettings = () => { isMenuOpen.value = false; router.push('/settings'); };
const openStats = () => { isMenuOpen.value = false; router.push('/stats'); };

const toggleSearch = () => {
    isSearchVisible.value = !isSearchVisible.value;
    if (isSearchVisible.value) {
        nextTick(() => { searchInputMobile.value?.focus(); });
    } else {
        store.searchQuery = '';
    }
};

const handleEdit = (task) => { router.push(`/task/${task.id}`); };
const openAdvancedAdd = () => { router.push('/task/new'); };

const deleteTask = async (id) => {
    if (window.confirm(t('app.alerts.delete_confirm'))) {
        try { await store.deleteTask(id); } catch (_e) { window.alert(t('app.alerts.delete_error')); }
    }
};

const handleMobileScroll = (e) => {
    currentMobileScreen.value = Math.round(e.target.scrollLeft / e.target.clientWidth);
};

const scrollToList = () => {
    if (props.isHandheld && mobileScrollContainer.value) {
        nextTick(() => { mobileScrollContainer.value.scrollLeft = mobileScrollContainer.value.clientWidth; });
    }
};

const pullDistance = ref(0);
const startY = ref(0);
const isPulling = ref(false);

const handleTouchStartPull = (e) => { if (e.currentTarget.scrollTop <= 0) { startY.value = e.touches[0].clientY; isPulling.value = true; } };
const handleTouchMovePull = (e) => {
    if (!isPulling.value) return;
    const diff = e.touches[0].clientY - startY.value;
    if (diff > 0) {
        pullDistance.value = Math.pow(diff, 0.85);
        if (pullDistance.value > 10 && e.cancelable) e.preventDefault();
    } else { pullDistance.value = 0; isPulling.value = false; }
};
const handleTouchEndPull = async () => {
    if (isPulling.value && pullDistance.value > 60 && !isRefreshing.value) {
        isRefreshing.value = true;
        try { await store.fetchAll(); } finally { isRefreshing.value = false; }
    }
    pullDistance.value = 0; isPulling.value = false;
};

onMounted(() => {
    nextTick(() => {
        if (verticalChartContainer.value) verticalChartContainer.value.scrollTop = verticalChartContainer.value.clientHeight;
    });
});

defineExpose({ scrollToList });
</script>

<style scoped>
@reference "../../css/app.css";

.mobile-scroll-container {
    -webkit-overflow-scrolling: touch;
}
.zoom-btn {
    @apply w-8 h-8 rounded-xl bg-[var(--bg-card)] text-[var(--color-text)] flex items-center justify-center text-lg active:scale-95 border border-[var(--color-border)];
}
</style>
