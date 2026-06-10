<template>
    <div class="flex items-center justify-around py-2 px-4 shrink-0 z-[60] bg-[var(--bg-card)] border-t border-[var(--color-border)] shadow-lg landscape:py-1">
        <!-- Home -->
        <router-link
            to="/"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            /></svg>
        </router-link>

        <!-- Stats -->
        <router-link
            to="/stats"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/stats' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
            /></svg>
        </router-link>

        <!-- Add (Plus) -->
        <button
            class="w-14 h-14 -mt-8 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-[var(--bg-app)]"
            @click="emit('open-advanced')"
        >
            <svg
                class="w-8 h-8"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            /></svg>
        </button>

        <!-- Notepad -->
        <router-link
            to="/notepad"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/notepad' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
            /></svg>
        </router-link>

        <!-- Settings -->
        <router-link
            to="/settings"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/settings' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <svg
                class="w-6 h-6"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
            ><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            /><path
                stroke-linecap="round"
                stroke-linejoin="round"
                stroke-width="2.5"
                d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            /></svg>
        </router-link>
    </div>
</template>

<script setup>
import { useBalanceStore } from '../stores/balance';

defineProps({
    currentScreen: {
        type: Number,
        default: 0
    },
    isMenuOpen: Boolean
});

const emit = defineEmits(['open-advanced']);
</script>
