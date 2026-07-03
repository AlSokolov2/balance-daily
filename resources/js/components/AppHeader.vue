<template>
    <header class="flex justify-between items-center px-1 py-2 shrink-0 z-50">
        <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            {{ $t('app.title') }}
        </h1>
        
        <div class="flex items-center gap-2 relative">
            <!-- Search Button (Desktop) -->
            <div
                class="flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-300"
                :class="[isSearchVisible ? 'w-64 pr-2' : 'w-10']"
            >
                <button class="w-10 h-10 flex items-center justify-center shrink-0 text-[var(--color-text)] hover:opacity-80 transition-opacity" @click="emit('toggle-search')">
                    <AppIcon v-if="!isSearchVisible" name="search" :size="18" />
                    <AppIcon v-else name="close" :size="16" class="text-[var(--color-secondary)]" />
                </button>
                <input
                    v-if="isSearchVisible" 
                    ref="searchInput"
                    type="text" 
                    :value="modelValue"
                    :placeholder="$t('app.search_placeholder')"
                    class="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-secondary)]"
                    @input="emit('update:modelValue', $event.target.value)"
                >
            </div>

            <button class="text-xs sm:text-sm font-bold text-[var(--color-text)] bg-[var(--bg-secondary)] h-10 px-4 rounded-xl hover:opacity-80 border border-[var(--color-border)] transition-colors" @click="emit('toggle-list')">
                {{ showTaskList ? $t('app.hide_list') : $t('app.show_list') }}
            </button>
            
            <div v-if="store.user" class="flex items-center gap-2 cursor-pointer ml-1 sm:ml-2" @click="emit('toggle-menu')">
                <img
                    :src="store.user.avatar"
                    class="w-9 h-9 rounded-xl border border-[var(--color-border)] object-cover shadow-sm"
                    referrerpolicy="no-referrer"
                    :title="store.user.name"
                >
                <AppIcon name="chevron-down" :size="16" class="text-gray-400" />
            </div>
            
            <!-- User Menu -->
            <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                <button class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3" @click="emit('open-stats')">
                    <AppIcon name="stats" :size="16" class="text-[var(--color-secondary)]" />
                    {{ $t('app.stats') }}
                </button>
                <button class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]" @click="emit('open-settings')">
                    <AppIcon name="settings" :size="16" class="text-[var(--color-secondary)]" />
                    {{ $t('app.settings') }}
                </button>
                <!-- Notepad -->
                <router-link
                    to="/notepad"
                    class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]"
                    @click="emit('toggle-menu')"
                >
                    <AppIcon name="notepad" :size="18" class="opacity-70" />
                    {{ $t('settings.tabs.notepad') }}
                </router-link>

                <a href="https://github.com/AlSokolov2/balance-daily/issues/new" target="_blank" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]">
                    <AppIcon name="comment" :size="18" class="opacity-70" />
                    {{ $t('app.feedback') }}
                </a>
                <button class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]" @click="emit('logout')">
                    <AppIcon name="logout" :size="16" />
                    {{ $t('app.logout') }}
                </button>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useBalanceStore } from '../stores/balance';
import AppIcon from './AppIcon.vue';

const props = defineProps({
    modelValue: {
        type: String,
        default: ''
    },
    isSearchVisible: Boolean,
    showTaskList: Boolean,
    isMenuOpen: Boolean
});

const emit = defineEmits([
    'update:modelValue',
    'toggle-search',
    'toggle-list',
    'toggle-menu',
    'logout',
    'open-settings',
    'open-stats'
]);

const store = useBalanceStore();
const searchInput = ref(null);

watch(() => props.isSearchVisible, (newVal) => {
    if (newVal) {
        nextTick(() => {
            searchInput.value?.focus();
        });
    }
});
</script>
