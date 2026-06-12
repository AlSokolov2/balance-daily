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
                    <svg
                        v-if="!isSearchVisible"
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                    <svg
                        v-else
                        class="w-4 h-4 text-[var(--color-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M6 18L18 6M6 6l12 12"
                        />
                    </svg>
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
                <svg
                    class="w-4 h-4 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </div>
            
            <!-- User Menu -->
            <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                <button class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3" @click="emit('open-stats')">
                    <svg
                        class="w-4 h-4 text-[var(--color-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                        />
                    </svg>
                    {{ $t('app.stats') }}
                </button>
                <button class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]" @click="emit('open-settings')">
                    <svg
                        class="w-4 h-4 text-[var(--color-secondary)]"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                        />
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                        />
                    </svg>
                    {{ $t('app.settings') }}
                </button>
                <!-- Notepad -->
                <router-link
                    to="/notepad"
                    class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]"
                    @click="emit('toggle-menu')"
                >
                    <svg
                        class="w-5 h-5 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    /></svg>
                    {{ $t('settings.tabs.notepad') }}
                </router-link>

                <a href="https://github.com/AlSokolov2/balance-daily/issues/new" target="_blank" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]">
                    <svg
                        class="w-5 h-5 opacity-70"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    /></svg>
                    {{ $t('app.feedback') }}
                </a>
                <button class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]" @click="emit('logout')">
                    <svg
                        class="w-4 h-4"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                        />
                    </svg>
                    {{ $t('app.logout') }}
                </button>
            </div>
        </div>
    </header>
</template>

<script setup>
import { ref, watch, nextTick } from 'vue';
import { useBalanceStore } from '../stores/balance';

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
