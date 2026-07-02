<template>
    <!-- Состояние загрузки сессии -->
    <div v-if="isInitializing" class="min-h-screen flex items-center justify-center bg-[var(--bg-app)]">
        <div class="text-[var(--color-primary)] font-bold animate-pulse text-lg text-center">
            {{ $t('auth.loading_app') }}
        </div>
    </div>

    <!-- Экран входа -->
    <AuthScreen v-else-if="!store.isAuthenticated" />

    <!-- Основное приложение: Router Shell -->
    <div v-else class="app-container w-full max-w-[1600px] mx-auto flex flex-col h-[100dvh] p-2 sm:p-4 overflow-hidden relative bg-[var(--bg-app)]">
        <div class="flex-1 min-h-0 flex flex-col overflow-hidden relative">
            <router-view v-slot="{ Component, route: currentRoute }">
                <transition :name="transitionName">
                    <component 
                        :is="Component" 
                        :key="currentRoute.path"
                        :is-handheld="isHandheld"
                        :offline-ready="isActuallyOfflineReady"
                        class="absolute inset-0"
                    />
                </transition>
            </router-view>
        </div>

        <!-- Global Mobile Navigation (One Click Tab Bar) -->
        <MobileBottomNav 
            v-if="isHandheld && !['edit-task', 'edit-category'].includes(route.name)"
            @open-advanced="openAdvancedAdd"
        />

        <!-- Toast Notification -->
        <ToastNotification />

        <!-- PWA Update Notification -->
        <div v-if="needRefresh" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-[100] cursor-pointer group" @click="updateServiceWorker(true)">
            <div class="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-full px-4 py-2 shadow-2xl flex items-center gap-3 animate-[slide-up_0.3s_ease-out] hover:scale-105 transition-all active:scale-95">
                <div class="w-6 h-6 rounded-full bg-[var(--btn-primary-bg)] flex items-center justify-center text-[10px] shrink-0 shadow-sm">
                    🚀
                </div>
                <span class="text-xs font-bold text-[var(--color-text)] pr-1">{{ $t('pwa.update_available') }}</span>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useBalanceStore } from './stores/balance';
import { useRegisterSW } from 'virtual:pwa-register/vue';
import { useI18n } from 'vue-i18n';

import AuthScreen from './components/AuthScreen.vue';
import MobileBottomNav from './components/MobileBottomNav.vue';
import ToastNotification from './components/ToastNotification.vue';

const { locale } = useI18n();
const { offlineReady, needRefresh, updateServiceWorker } = useRegisterSW();

const store = useBalanceStore();
const router = useRouter();
const route = useRoute();

const isInitializing = ref(true);
const isActuallyOfflineReady = ref(false);
const isHandheld = ref(false);
const transitionName = ref('slide-left');

const openAdvancedAdd = () => {
    router.push('/task/new');
};

// Route Transition Logic
const routeOrder = { 'home': 0, 'stats': 1, 'notepad': 2, 'settings': 3 };

watch(() => route.name, (toName, fromName) => {
    const toDepth = routeOrder[toName] ?? 99;
    const fromDepth = routeOrder[fromName] ?? 99;

    if (toName?.startsWith('edit-') || fromName?.startsWith('edit-')) {
        transitionName.value = toName?.startsWith('edit-') ? 'slide-up' : 'slide-down';
    } else {
        transitionName.value = toDepth < fromDepth ? 'slide-right' : 'slide-left';
    }
});

// Watchers
watch(() => offlineReady.value, (val) => { if (val) isActuallyOfflineReady.value = true; }, { immediate: true });
watch(() => store.locale, (newLocale) => { if (newLocale) locale.value = String(newLocale); }, { immediate: true });

// Layout Detection
const updateDimensions = () => {
    const isTouch = (navigator.maxTouchPoints > 0) || ('ontouchstart' in window);
    isHandheld.value = isTouch || window.innerWidth < 640;
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
});

onUnmounted(() => { window.removeEventListener('resize', updateDimensions); });
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
input[type="range"] { accent-color: var(--color-text); }

@keyframes slide-up {
    from { transform: translate(-50%, 100%); opacity: 0; }
    to { transform: translate(-50%, 0); opacity: 1; }
}

/* Route Transitions */
.slide-left-enter-active, .slide-left-leave-active,
.slide-right-enter-active, .slide-right-leave-active,
.slide-up-enter-active, .slide-up-leave-active,
.slide-down-enter-active, .slide-down-leave-active {
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

/* Horizontal Slides */
.slide-left-enter-from { transform: translateX(100%); opacity: 0; }
.slide-left-leave-to { transform: translateX(-30%); opacity: 0; }

.slide-right-enter-from { transform: translateX(-100%); opacity: 0; }
.slide-right-leave-to { transform: translateX(30%); opacity: 0; }

/* Vertical Stack Slides */
.slide-up-enter-from { transform: translateY(100%); }
.slide-up-leave-to { opacity: 0.5; transform: scale(0.95); }

.slide-down-enter-from { opacity: 0.5; transform: scale(0.95); }
.slide-down-leave-to { transform: translateY(100%); }
</style>
