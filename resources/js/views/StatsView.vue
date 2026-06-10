<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/></svg>
                </div>
                <h2 class="text-xl font-black text-[var(--color-text)] uppercase tracking-tight">
                    {{ $t('stats.title') }}
                </h2>
            </div>
            <!-- Back Button for Navigation -->
            <button class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-opacity border border-[var(--color-border)]" @click="router.push('/')">
                <svg class="w-5 h-5 text-[var(--color-text)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>
            </button>
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <!-- Loading State -->
            <div v-if="loading" class="h-64 flex flex-col items-center justify-center gap-4">
                <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p class="text-sm font-bold text-[var(--color-secondary)] uppercase tracking-widest">{{ $t('common.loading') }}</p>
            </div>

            <template v-else-if="store.stats">
                <!-- Counters Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div v-for="(val, key) in counters" :key="key" class="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--color-border)] shadow-sm">
                        <p class="text-[9px] font-black text-[var(--color-secondary)] uppercase tracking-widest mb-1">{{ $t(`stats.counters.${key}`) }}</p>
                        <p class="text-2xl font-black text-[var(--color-text)]">{{ val }}</p>
                    </div>
                </div>

                <!-- Heatmap Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest">{{ $t('stats.heatmap.title') }}</h3>
                        <span class="text-[10px] text-[var(--color-secondary)] font-bold italic">{{ $t('stats.heatmap.subtitle') }}</span>
                    </div>
                    <div class="bg-[var(--bg-card)] p-4 rounded-[24px] border border-[var(--color-border)] overflow-x-auto scrollbar-hide shadow-sm">
                        <div class="flex gap-1 min-w-max">
                            <div v-for="week in heatmapWeeks" :key="week[0].date" class="flex flex-col gap-1">
                                <div
                                    v-for="day in week"
                                    :key="day.date" 
                                    class="w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-help"
                                    :class="getHeatmapClass(day.count)"
                                    :title="`${day.date}: ${day.count} ${$t('stats.heatmap.completions')}`"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Balance Section -->
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest px-1">{{ $t('stats.balance.title') }}</h3>
                    <div class="bg-[var(--bg-card)] p-6 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                        <div v-if="!store.stats.category_balance.length" class="text-center py-4 text-xs text-[var(--color-secondary)] italic">
                            {{ $t('stats.balance.no_data') }}
                        </div>
                        <div v-else class="space-y-5">
                            <div v-for="item in sortedBalance" :key="item.category_slug" class="space-y-2">
                                <div class="flex items-center justify-between text-[11px] font-bold">
                                    <span class="text-[var(--color-text)]">{{ getCatName(item.category_slug) }}</span>
                                    <span class="text-[var(--color-secondary)]">{{ item.count }}</span>
                                </div>
                                <div class="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-1000"
                                        :style="{ 
                                            width: `${(item.count / maxBalance) * 100}%`,
                                            backgroundColor: getCatColor(item.category_slug)
                                        }"
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </template>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';

const store = useBalanceStore();
const router = useRouter();
const loading = ref(true);

onMounted(async () => {
    await store.fetchStats();
    loading.value = false;
});

const counters = computed(() => store.stats?.counters || {});

const heatmapWeeks = computed(() => {
    if (!store.stats?.heatmap) return [];
    const weeks = [];
    const now = new Date();
    const startDate = new Date();
    startDate.setDate(now.getDate() - 90); 
    const dayOfWeek = startDate.getDay();
    const diff = startDate.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const gridStart = new Date(startDate.setDate(diff));
    let currentWeek = [];
    const iterDate = new Date(gridStart);
    while (iterDate <= now) {
        const dateStr = iterDate.toISOString().split('T')[0];
        currentWeek.push({ date: dateStr, count: store.stats.heatmap[dateStr] || 0 });
        if (currentWeek.length === 7) { weeks.push(currentWeek); currentWeek = []; }
        iterDate.setDate(iterDate.getDate() + 1);
    }
    if (currentWeek.length) weeks.push(currentWeek);
    return weeks;
});

const getHeatmapClass = (count) => {
    if (count === 0) return 'bg-[var(--color-border)] opacity-20';
    if (count <= 1) return 'bg-blue-500 opacity-30';
    if (count <= 3) return 'bg-blue-500 opacity-60';
    if (count <= 5) return 'bg-blue-500 opacity-80';
    return 'bg-blue-500 opacity-100 shadow-[0_0_8px_rgba(59,130,246,0.5)]';
};

const sortedBalance = computed(() => [...(store.stats?.category_balance || [])].sort((a, b) => b.count - a.count));
const maxBalance = computed(() => Math.max(...(store.stats?.category_balance.map(b => b.count) || [1])));
const getCatName = (slug) => store.categories.find(c => c.slug === slug)?.name || slug;
const getCatColor = (slug) => store.categories.find(c => c.slug === slug)?.color || '#8e8e93';
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
