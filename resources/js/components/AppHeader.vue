<template>
    <header class="flex justify-between items-center px-1 py-2 shrink-0 z-50">
        <h1 class="text-xl sm:text-2xl font-bold text-[var(--color-text)] tracking-tight">
            {{ $t('app.title') }}
        </h1>
        
        <div class="flex items-center gap-2 relative">
            <!-- Search Button (Desktop) -->
            <div class="flex items-center bg-[var(--bg-secondary)] rounded-xl border border-[var(--color-border)] overflow-hidden transition-all duration-300"
                 :class="[isSearchVisible ? 'w-64 pr-2' : 'w-10']">
                <button @click="emit('toggle-search')" class="w-10 h-10 flex items-center justify-center shrink-0 text-[var(--color-text)] hover:opacity-80 transition-opacity">
                    <svg v-if="!isSearchVisible" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                    </svg>
                    <svg v-else class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                </button>
                <input v-if="isSearchVisible" 
                       ref="searchInput"
                       type="text" 
                       :value="modelValue"
                       @input="emit('update:modelValue', $event.target.value)"
                       :placeholder="$t('app.search_placeholder')"
                       class="flex-1 bg-transparent border-none outline-none text-sm text-[var(--color-text)] placeholder-[var(--color-secondary)]">
            </div>

            <button @click="emit('toggle-list')" class="text-xs sm:text-sm font-bold text-[var(--color-text)] bg-[var(--bg-secondary)] h-10 px-4 rounded-xl hover:opacity-80 border border-[var(--color-border)] transition-colors">
                {{ showTaskList ? $t('app.hide_list') : $t('app.show_list') }}
            </button>
            
            <div v-if="store.user" class="flex items-center gap-2 cursor-pointer ml-1 sm:ml-2" @click="emit('toggle-menu')">
                <img :src="store.user.avatar" class="w-9 h-9 rounded-xl border border-[var(--color-border)] object-cover shadow-sm" referrerpolicy="no-referrer" :title="store.user.name">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
            
            <!-- User Menu -->
            <div v-if="isMenuOpen" class="absolute right-0 top-full mt-2 w-52 bg-[var(--bg-card)] rounded-2xl shadow-xl border border-[var(--color-border)] overflow-hidden z-50">
                <button @click="emit('open-settings')" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3">
                    <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                    </svg>
                    {{ $t('app.settings') }}
                </button>
                <button @click="emit('logout')" class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 border-t border-[var(--color-border)]">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
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
    modelValue: String,
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
    'open-settings'
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
