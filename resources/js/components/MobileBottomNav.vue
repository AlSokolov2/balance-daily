<template>
    <div class="flex items-center gap-2 py-3 px-2 shrink-0 z-[60] bg-[var(--bg-app)] border-t border-[var(--color-border)]">
        
        <!-- Filter Selector -->
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
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
                </svg>
            </div>
        </div>

        <!-- Pagination Indicators -->
        <div class="flex gap-1.5 px-1.5">
            <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentScreen === 0 ? 'bg-[var(--color-text)] w-3.5' : 'bg-[var(--color-border)]']"></div>
            <div :class="['w-1.5 h-1.5 rounded-full transition-all', currentScreen === 1 ? 'bg-[var(--color-text)] w-3.5' : 'bg-[var(--color-border)]']"></div>
        </div>

        <!-- Controls -->
        <div class="flex items-center gap-2 relative">
            <button @click="emit('toggle-search')" class="w-12 h-12 bg-[var(--bg-secondary)] text-[var(--color-text)] rounded-xl flex items-center justify-center active:scale-90 transition-transform shrink-0 border border-[var(--color-border)]">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                </svg>
            </button>

            <button @click="emit('open-advanced')" class="w-12 h-12 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl shadow-lg flex items-center justify-center active:scale-90 transition-transform shrink-0 border border-[var(--color-border)]">
                <svg class="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path>
                </svg>
            </button>
            
            <div v-if="store.user" class="relative">
                <img :src="store.user.avatar" @click="emit('toggle-menu')" 
                     class="w-12 h-12 rounded-xl border border-[var(--color-border)] shadow-sm object-cover cursor-pointer active:scale-90 transition-transform" 
                     referrerpolicy="no-referrer">
                
                <!-- Upward Menu -->
                <div v-if="isMenuOpen" class="absolute right-0 bottom-full mb-3 w-56 bg-[var(--bg-card)] rounded-[24px] shadow-[0_12px_40px_rgba(0,0,0,0.12)] border border-[var(--color-border)] overflow-hidden z-[70]">
                    <div class="px-5 py-4 bg-[var(--bg-secondary)] border-b border-[var(--color-border)]">
                        <div class="text-[13px] font-bold text-[var(--color-text)] truncate">{{ store.user.name }}</div>
                        <div class="text-[11px] text-[var(--color-secondary)] truncate">{{ store.user.email }}</div>
                    </div>
                    <div class="p-1.5">
                        <button @click="emit('open-stats')" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 rounded-xl transition-colors">
                            <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"></path>
                            </svg>
                            {{ $t('app.stats') }}
                        </button>
                        <button @click="emit('open-settings')" class="w-full text-left px-4 py-3 text-sm text-[var(--color-text)] hover:bg-[var(--bg-secondary)] flex items-center gap-3 rounded-xl transition-colors mt-1 border-t border-[var(--color-border)] pt-3">
                            <svg class="w-4 h-4 text-[var(--color-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"></path>
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                            </svg>
                            {{ $t('app.settings') }}
                        </button>
                        <button @click="emit('logout')" class="w-full text-left px-4 py-3 text-sm text-red-500 hover:bg-[var(--bg-secondary)] flex items-center gap-3 rounded-xl transition-colors mt-1 border-t border-[var(--color-border)] pt-3">
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
                            </svg>
                            {{ $t('app.logout') }}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { useBalanceStore } from '../stores/balance';

const props = defineProps({
    currentScreen: Number,
    isMenuOpen: Boolean
});

const emit = defineEmits([
    'toggle-search', 
    'open-advanced', 
    'toggle-menu', 
    'logout', 
    'open-settings'
]);

const store = useBalanceStore();
</script>
