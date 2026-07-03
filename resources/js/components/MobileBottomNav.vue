<template>
    <div class="flex items-center justify-around py-2 px-4 shrink-0 z-[60] bg-[var(--bg-card)] border-t border-[var(--color-border)] shadow-lg landscape:py-1">
        <!-- Home -->
        <router-link
            to="/"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <AppIcon name="home" :size="24" :strokeWidth="2.5" />
        </router-link>

        <!-- Stats -->
        <router-link
            to="/stats"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/stats' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <AppIcon name="stats" :size="24" :strokeWidth="2.5" />
        </router-link>

        <!-- Add (Plus) -->
        <button
            class="w-14 h-14 -mt-8 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-full shadow-2xl flex items-center justify-center active:scale-90 transition-transform border-4 border-[var(--bg-app)]"
            @click="emit('open-advanced')"
        >
            <AppIcon name="plus" :size="32" :strokeWidth="2.5" />
        </button>

        <!-- Notepad -->
        <router-link
            to="/notepad"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/notepad' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <AppIcon name="notepad" :size="24" :strokeWidth="2.5" />
        </router-link>

        <!-- Settings -->
        <router-link
            to="/settings"
            :class="['p-3 rounded-2xl transition-all', $route.path === '/settings' ? 'text-[var(--color-primary)] bg-[var(--bg-secondary)]' : 'text-[var(--color-secondary)]']"
        >
            <AppIcon name="settings" :size="24" :strokeWidth="2.5" />
        </router-link>
    </div>
</template>

<script setup>
import AppIcon from './AppIcon.vue';

defineProps({
    currentScreen: {
        type: Number,
        default: 0
    },
    isMenuOpen: Boolean
});

const emit = defineEmits(['open-advanced']);
</script>
