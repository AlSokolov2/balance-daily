<template>
    <div class="px-1 mb-3 shrink-0">
        <div class="flex gap-1 bg-[var(--bg-secondary)] p-1 rounded-2xl overflow-x-auto pb-1 scrollbar-hide snap-x border border-[var(--color-border)]">
            <div
                :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'all' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']" 
                @click="store.filterCat = 'all'"
            >
                {{ $t('app.filter.all') }} ({{ store.counts.all }})
            </div>
            
            <div
                v-for="cat in store.categories.filter(c => c.slug !== '__archive__')"
                :key="cat.slug"
                :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === cat.slug ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']"
                @click="store.filterCat = cat.slug"
            >
                {{ cat.name }} ({{ store.counts.byCat[cat.slug] || 0 }})
            </div>
            
            <div
                :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'hidden' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']"
                @click="store.filterCat = 'hidden'"
            >
                {{ $t('app.filter.hidden') }} ({{ store.counts.hidden }})
            </div>
            
            <div
                :class="['whitespace-nowrap px-6 py-2 rounded-xl cursor-pointer text-xs font-bold uppercase tracking-wider transition-all snap-start shadow-sm', store.filterCat === 'archive' ? 'bg-[var(--bg-card)] text-[var(--color-text)] border border-[var(--color-border)]' : 'text-[var(--color-secondary)] hover:text-[var(--color-text)]']"
                @click="store.filterCat = 'archive'"
            >
                {{ $t('app.filter.archive') }} ({{ store.counts.archive }})
            </div>
        </div>
    </div>
</template>

<script setup>
import { useBalanceStore } from '../stores/balance';

const store = useBalanceStore();
</script>
