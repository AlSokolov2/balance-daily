<template>
    <!--
        Sort control for the archive and the hidden list (#155). Renders nothing outside
        those two: everywhere else `filteredTasks` has a meaningful order of its own
        (priority), and there is nothing to choose.
    -->
    <div v-if="keys.length" class="flex items-center gap-1 px-3 pt-2 pb-1 shrink-0 overflow-x-auto scrollbar-hide">
        <span class="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-secondary)] mr-1 shrink-0">
            {{ $t('app.sort.label') }}
        </span>
        <button
            v-for="key in keys"
            :key="key"
            type="button"
            :aria-pressed="active === key"
            :class="['whitespace-nowrap px-3 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all border', active === key ? 'bg-[var(--bg-card)] text-[var(--color-text)] border-[var(--color-border)] shadow-sm' : 'bg-transparent text-[var(--color-secondary)] border-transparent hover:text-[var(--color-text)]']"
            @click="store[stateKey] = key"
        >
            {{ $t(`app.sort.${key}`) }}
        </button>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import { useBalanceStore } from '../stores/balance';
import { ARCHIVE_SORT_KEYS, HIDDEN_SORT_KEYS } from '../utils/task-sort.js';

const store = useBalanceStore();

const stateKey = computed(() => (store.filterCat === 'archive' ? 'archiveSort' : 'hiddenSort'));

const keys = computed(() => {
    if (store.filterCat === 'archive') return ARCHIVE_SORT_KEYS;
    if (store.filterCat === 'hidden') return HIDDEN_SORT_KEYS;
    return [];
});

const active = computed(() => store[stateKey.value]);
</script>
