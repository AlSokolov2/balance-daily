<template>
    <!-- Состояние загрузки сессии -->
    <div v-if="isInitializing" class="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div class="text-[var(--color-primary)] font-bold animate-pulse text-lg text-center">
            {{ $t('auth.loading_app') }}
        </div>
    </div>

    <!-- Экран входа (если не авторизован) -->
    <div v-else-if="!store.isAuthenticated" class="min-h-screen flex items-center justify-center bg-[var(--bg-app)] p-4">
        <div class="card bg-[var(--bg-card)] rounded-[32px] p-10 w-full max-sm shadow-[0_8px_40px_rgba(0,0,0,0.04)] border border-[var(--color-border)] text-center">
            <div class="w-20 h-20 bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl mx-auto mb-8 flex items-center justify-center text-[var(--color-text)] shadow-sm">
                <svg class="w-10 h-10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="m2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z"/><path d="M7 21h10"/><path d="M12 3v18"/><path d="M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2"/></svg>
            </div>
            <h1 class="text-2xl font-bold text-[var(--color-text)] mb-2 tracking-tight">{{ $t('app.title') }}</h1>
            <p class="text-[var(--color-secondary)] text-[15px] mb-10 leading-relaxed px-4">
                {{ $t('auth.description') }}
            </p>
            
            <button @click="loginWithGoogle" class="w-full py-3.5 bg-[var(--bg-card)] border border-[var(--color-border)] text-[var(--color-text)] rounded-xl font-bold text-[15px] flex items-center justify-center gap-3 hover:bg-[var(--bg-secondary)] transition-all active:scale-[0.98] shadow-sm">
                <svg class="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.18 1-.78 1.85-1.63 2.53v2.1h2.64c1.55-1.42 2.43-3.52 2.43-6.64z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-2.64-2.1c-.73.49-1.66.78-2.64.78-2.85 0-5.27-1.92-6.13-4.51H5.17v2.13A11.997 11.997 0 0 0 12 23z"/><path fill="#FBBC05" d="M5.87 14.51c-.22-.66-.35-1.36-.35-2.01s.13-1.35.35-2.01V7.87H3.04C2.37 9.13 2 10.52 2 12s.37 2.87 1.04 4.13l2.83-2.12z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.73 1 4.15 3.13 3.04 6.22l2.83 2.12c.86-2.59 3.28-4.51 6.13-4.51z"/></svg>
                {{ $t('auth.login_with_google') }}
            </button>
            
            <p class="mt-10 text-[11px] text-[var(--color-secondary)] leading-relaxed uppercase tracking-wider font-semibold opacity-50">
                Productivity & Balance
            </p>
        </div>
    </div>

    <!-- Основное приложение (после входа) -->
    <div v-else class="app-container w-full max-w-[1600px] mx-auto flex flex-col h-[100dvh] p-2 sm:p-4 overflow-hidden relative bg-[var(--bg-app)]">
        <header v-if="!isHandheld" class="flex justify-between items-center px-1 py-2 shrink-0 z-50">
            <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
                {{ $t('app.title') }}
            </h1>
            
            <div class="flex items-center gap-2 relative">
                <button @click="showTaskList = !showTaskList" class="text-xs sm:text-sm font-bold text-[var(--color-text)] bg-[var(--bg-secondary)] px-4 py-2 rounded-xl hover:opacity-80 border border-[var(--color-border)] transition-colors">
                    {{ showTaskList ? $t('app.hide_list') : $t('app.show_list') }}
                </button>
                <div v-if="store.user" class="flex items-center gap-2 cursor-pointer ml-1 sm:ml-2" @click="isMenuOpen = !isMenuOpen">
                    <img :src="store.user.avatar" class="w-9 h-9 rounded-xl border border-[var(--color-border)] object-cover shadow-sm" referrerpolicy="no-referrer" :title="store.user.name">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
                
                <!-- Выпадающее меню (Desktop) -->
                <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                    <button @click="openSettings" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3">
                        <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                        {{ $t('app.settings') }}
                    </button>
                    <button @click="handleLogout" class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                        {{ $t('app.logout') }}
                    </button>
                </div>
            </div>
        </header>

        <!-- Overlay для закрытия меню по клику снаружи -->
        <div v-if="isMenuOpen" @click="isMenuOpen = false" class="fixed inset-0 z-40"></div>

        <!-- Форма добавления (Desktop only) -->
        <div v-if="!isHandheld" class="flex items-center gap-2 mb-3 px-1 shrink-0 z-10 relative">
            <input v-model="newTask.title" :placeholder="$t('app.placeholder')" @keyup.enter="addTask" class="flex-1 p-[12px_16px] rounded-2xl border border-[var(--color-border)] shadow-sm text-[15px] outline-none focus:ring-2 focus:ring-[var(--color-border)] transition-all bg-[var(--bg-card)] text-[var(--color-text)]">
            <button @click="openAdvancedAdd" class="p-[12px] bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-2xl font-bold shadow-sm hover:opacity-80 transition-colors w-[46px] h-[46px] flex items-center justify-center shrink-0 border border-[var(--color-border)]" title="Расширенное добавление">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
            </button>
        </div>

        <!-- Фильтры (Desktop only) -->
        <div v-if="!isHandheld" class="px-1 mb-3 shrink-0">
            <div class="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl overflow-x-auto pb-1 scrollbar-hide snap-x border border-[var(--color-border)]">
                <div @click="store.filterCat = 'all'" 
                     :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'all' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                    {{ $t('app.filter.all') }} ({{ store.counts.all }})
                </div>
                <div v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug"
                     @click="store.filterCat = cat.slug"
                     :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === cat.slug ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                    {{ cat.name }} ({{ store.counts.byCat[cat.slug] || 0 }})
                </div>
                <div @click="store.filterCat = 'hidden'"
                     :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'hidden' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                    {{ $t('app.filter.hidden') }} ({{ store.counts.hidden }})
                </div>
                <div @click="store.filterCat = 'archive'"
                     :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'archive' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']">
                    {{ $t('app.filter.archive') }} ({{ store.counts.archive }})
                </div>
            </div>
        </div>

        <!-- Контент свайпа (Handheld: Chart <-> List, Desktop: Just content) -->
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden pt-1 handheld:pt-0">
            <!-- Mobile/Handheld Swipe View -->
            <div v-if="isHandheld" ref="mobileScrollContainer" class="mobile-scroll-container flex-1 flex overflow-x-auto snap-x snap-mandatory scrollbar-hide scroll-smooth" @scroll="handleMobileScroll">
                <!-- Screen 1: Bubble Chart -->
                <div class="min-w-full h-full snap-start p-1 flex flex-col">
                    <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0">
                        <BubbleChart @edit="handleEdit" class="flex-1 w-full h-full" />
                    </div>
                </div>
                <!-- Screen 2: Task List -->
                <div class="min-w-full h-full snap-start p-1 flex flex-col">
                    <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] overflow-y-auto p-3">
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

            <!-- Desktop View -->
            <div v-else class="flex-1 flex flex-col h-full gap-3">
                <!-- Визуализация -->
                <div class="flex-1 bg-[var(--bg-card)] rounded-3xl shadow-sm border border-[var(--color-border)] relative overflow-hidden flex flex-col min-h-0 min-w-0">
                    <BubbleChart @edit="handleEdit" class="flex-1 w-full h-full" />
                </div>

                <!-- Список задач (Desktop toggleable) -->
                <div v-if="showTaskList" class="card bg-[var(--bg-card)] rounded-[16px] p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-[var(--color-border)] min-h-[100px] overflow-y-auto shrink-0 max-h-[30vh]">
                    <div v-if="!store.filteredTasks.length" class="text-center py-8 text-[var(--color-secondary)] text-sm">
                        {{ $t('app.no_tasks') }}
                    </div>
                    <TaskItem v-for="task in store.filteredTasks" 
                              :key="task.id" 
                              :task="task"
                              @edit="handleEdit"
                              @delete="deleteTask" />
                </div>
                
                <!-- Desktop Zoom Controls Overlay -->
                <div v-if="!isHandheld" class="absolute bottom-4 right-4 flex items-center gap-1 bg-[var(--bg-card)]/80 backdrop-blur-md p-1.5 rounded-2xl border border-[var(--color-border)] shadow-sm z-10">
                    <button @click="store.bubbleZoom = Math.max(0.5, store.bubbleZoom - 0.1)" class="w-8 h-8 rounded-xl bg-[var(--bg-card)] text-[var(--color-text)] flex items-center justify-center hover:bg-[var(--bg-secondary)] font-bold text-lg active:scale-95 transition-all border border-[var(--color-border)]">-</button>
                    <button @click="store.bubbleZoom = 1" class="px-2 text-[10px] font-bold text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors min-w-[36px] text-center">
                        {{ store.bubbleZoom.toFixed(1) }}x
                    </button>
                    <button @click="store.bubbleZoom = Math.min(2, store.bubbleZoom + 0.1)" class="w-8 h-8 rounded-xl bg-[var(--bg-card)] text-[var(--color-text)] flex items-center justify-center hover:bg-[var(--bg-secondary)] font-bold text-lg active:scale-95 transition-all border border-[var(--color-border)]">+</button>
                </div>
            </div>
        </div>

        <!-- Нижняя панель управления (Handheld) -->
        <div v-if="isHandheld" 
             class="flex items-center gap-2 py-3 px-2 shrink-0 z-[60] bg-[var(--bg-app)] border-t border-[var(--color-border)]">
            
            <!-- Фильтр (Слева) -->
            <div class="flex-1 min-w-0 relative">
                <select v-model="store.filterCat" class="w-full bg-[var(--bg-secondary)] border border-[var(--color-border)] p-3 rounded-xl text-xs font-bold text-[var(--color-text)] outline-none appearance-none shadow-sm focus:ring-2 focus:ring-[var(--color-border)] transition-all">
                    <option value="all">{{ $t('app.filter.all') }} ({{ store.counts.all }})</option>
                    <option v-for="cat in store.categories.filter(c => c.slug !== '__archive__')" :key="cat.slug" :value="cat.slug">
                        {{ cat.name }} ({{ store.counts.byCat[cat.slug] || 0 }})
                    </option>
                    <option value="hidden">{{ $t('app.filter.hidden') }} ({{ store.counts.hidden }})</option>
                    <option value="archive">{{ $t('app.filter.archive') }} ({{ store.counts.archive }})</option>
                </select>
                <div class="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[var(--color-secondary)]">
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
                </div>
            </div>

            <!-- Пагинация (Центр) -->
            <div class="flex gap-1.5 px-1.5">
                <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentMobileScreen === 0 ? 'bg-[var(--color-text)] w-3.5' : 'bg-[var(--color-border)]']"></div>
                <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentMobileScreen === 1 ? 'bg-[var(--color-text)] w-3.5' : 'bg-[var(--color-border)]']"></div>
            </div>

            <!-- Управление (Справа: FAB + Avatar) -->
            <div class="flex items-center gap-2 relative">
                <button @click="openAdvancedAdd" class="w-12 h-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-transform shrink-0 border border-[var(--color-border)]">
                    <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                </button>
                
                <div v-if="store.user" class="relative">
                    <img :src="store.user.avatar" @click="isMenuOpen = !isMenuOpen" 
                         class="w-12 h-12 rounded-xl border border-[var(--color-border)] shadow-sm object-cover cursor-pointer active:scale-90 transition-transform" 
                         referrerpolicy="no-referrer">
                    
                    <!-- Выпадающее меню (Handheld - открывается вверх) -->
                    <div v-if="isMenuOpen" class="absolute right-0 bottom-full mb-3 w-56 bg-[var(--bg-card)] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[var(--color-border)] overflow-hidden z-[70]">
                        <div class="px-5 py-4 bg-[var(--bg-secondary)] border-b border-[var(--color-border)]">
                            <div class="text-[13px] font-bold text-[var(--color-text)] truncate">{{ store.user.name }}</div>
                            <div class="text-[11px] text-[var(--color-secondary)] truncate">{{ store.user.email }}</div>
                        </div>
                        <div class="p-1.5">
                            <button @click="openSettings" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 rounded-xl transition-colors">
                                <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                                {{ $t('app.settings') }}
                            </button>
                            <button @click="handleLogout" class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 rounded-xl transition-colors mt-1 border-t border-[var(--color-border)] pt-3">
                                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                                {{ $t('app.logout') }}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Модальные окна -->
        <EditTaskModal v-if="editingTask" :task="editingTask" :isNew="editingTask.isNew" @close="editingTask = null" />
        <SettingsModal v-if="showSettingsModal" @close="showSettingsModal = false" />

        <!-- PWA Уведомления -->
        <div v-if="offlineReady || needRefresh" 
             class="fixed top-4 left-1/2 -translate-x-1/2 z-[1000] w-[calc(100%-2rem)] max-w-sm bg-[var(--bg-card)] border border-[var(--color-border)] rounded-2xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl">
            <div class="flex items-start gap-3">
                <div class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center text-xl shrink-0">
                    {{ needRefresh ? '🚀' : '📱' }}
                </div>
                <div class="flex-1 min-w-0">
                    <p class="text-sm font-bold text-[var(--color-text)]">
                        {{ needRefresh ? $t('pwa.update_available') : $t('pwa.offline_ready') }}
                    </p>
                    <p class="text-[12px] text-[var(--color-secondary)] leading-snug mt-0.5">
                        {{ needRefresh ? $t('pwa.update_ready_text') : $t('pwa.offline_ready_text') }}
                    </p>
                </div>
            </div>
            <div class="flex gap-2">
                <button v-if="needRefresh" @click="updateServiceWorker(true)" 
                        class="flex-1 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl text-xs font-bold shadow-sm">
                    {{ $t('pwa.update_now') }}
                </button>
                <button @click="closePWA" 
                        :class="['py-2.5 rounded-xl text-xs font-bold transition-all border border-[var(--color-border)]', needRefresh ? 'px-4 bg-[var(--bg-secondary)] text-[var(--color-text)]' : 'flex-1 bg-[var(--bg-secondary)] text-[var(--color-text)]']">
                    {{ needRefresh ? $t('common.later') : $t('common.understand') }}
                </button>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useBalanceStore } from './stores/balance';
import BubbleChart from './components/BubbleChart.vue';
import TaskItem from './components/TaskItem.vue';
import EditTaskModal from './components/EditTaskModal.vue';
import SettingsModal from './components/SettingsModal.vue';
import axios from 'axios';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useI18n } from 'vue-i18n';

const { locale } = useI18n();
const {
    offlineReady,
    needRefresh,
    updateServiceWorker,
} = useRegisterSW();

const closePWA = () => {
    offlineReady.value = false;
    needRefresh.value = false;
};

const store = useBalanceStore();
const mobileScrollContainer = ref(null);

// Sync i18n locale with store locale
watch(() => store.locale, (newLocale) => {
    if (newLocale) {
        locale.value = String(newLocale);
    }
}, { immediate: true });

// Auto-open task list when filtering by Archive or Hidden
watch(() => store.filterCat, (newCat) => {
    if (newCat === 'archive' || newCat === 'hidden') {
        showTaskList.value = true;
        scrollToList();
    }
});

const scrollToList = () => {
    if (isHandheld.value && mobileScrollContainer.value) {
        nextTick(() => {
            mobileScrollContainer.value.scrollLeft = mobileScrollContainer.value.clientWidth;
        });
    }
};

const showTaskList = ref(false);
const showSettingsModal = ref(false);
const isMenuOpen = ref(false);
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

onMounted(async () => {
    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    
    // Theme listener for system changes
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', () => {
        if (store.theme === 'system') {
            store.applyTheme();
        }
    });

    await store.init();
    // After init, store.locale might have changed from server settings
    locale.value = store.locale;
    isInitializing.value = false;
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
    repeat_type: 'none',
    repeat_interval: 1,
    repeat_days: [],
    deadline: '',
    postpone_until: '',
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
            repeat_type: 'none',
            repeat_interval: 1,
            repeat_days: [],
            deadline: '',
            postpone_until: '',
            ha: false,
            force_active: false,
            notes: '',
        };
    } catch (error) {
        alert(t('app.alerts.add_error'));
    }
};

const deleteTask = async (id) => {
    if (confirm(t('app.alerts.delete_confirm'))) {
        try {
            await store.deleteTask(id);
        } catch (error) {
            alert(t('app.alerts.delete_error'));
        }
    }
};

const handleEdit = (task) => {
    editingTask.value = task;
};

defineExpose({
    showTaskList,
    isHandheld,
    mobileScrollContainer,
    updateDimensions,
    isInitializing,
    scrollToList
});

const resetDay = async () => {
    if (confirm(t('app.alerts.reset_day_confirm'))) {
        store.categories.forEach(c => {
            c.completedCount = 0; 
        });
        store.recalculateAll();
    }
};
</script>

<style>
/* Utilities specifically for reference match */
.rounded-10 { border-radius: 10px; }
.rounded-12 { border-radius: 12px; }
.rounded-8 { border-radius: 8px; }

button {
    background: var(--btn-primary-bg);
    color: var(--btn-primary-text);
    border: 1px solid var(--color-border);
    font-weight: 700;
    cursor: pointer;
    transition: all 0.2s ease;
}
button:hover {
    background: var(--bg-secondary);
    border-color: var(--color-secondary);
}
button.secondary {
    background: var(--btn-secondary-bg);
    color: var(--btn-secondary-text);
}
input[type="range"] {
    accent-color: var(--color-text);
}
</style>
