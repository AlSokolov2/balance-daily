<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="flex items-center justify-between px-6 py-5 border-b border-[var(--color-border)] shrink-0">
            <div class="flex items-center gap-3">
                <div class="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <AppIcon name="stats" :size="24" />
                </div>
                <h2 class="text-xl font-black text-[var(--color-text)] uppercase tracking-tight">
                    {{ $t('stats.title') }}
                </h2>
            </div>
            <BaseButton
                variant="secondary"
                size="sm"
                icon="close"
                @click="router.push('/')"
            />
        </div>

        <!-- Content -->
        <div class="flex-1 overflow-y-auto p-6 space-y-8 custom-scrollbar">
            <!-- Loading State -->
            <div v-if="loading" class="h-64 flex flex-col items-center justify-center gap-4">
                <div class="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
                <p class="text-sm font-bold text-[var(--color-secondary)] uppercase tracking-widest">
                    {{ $t('common.loading') }}
                </p>
            </div>

            <template v-else-if="store.stats">
                <!-- System Status Block -->
                <div v-if="store.stats.status" class="space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest">
                            {{ $t('stats.status.title') }}
                        </h3>
                    </div>

                    <!-- Status cards row -->
                    <div class="grid grid-cols-3 md:grid-cols-6 gap-3">
                        <div
                            v-for="card in statusCards"
                            :key="card.key"
                            class="bg-[var(--bg-card)] p-3 rounded-2xl border text-center"
                            :class="[card.borderClass, card.clickable ? 'cursor-pointer hover:scale-105 transition-transform' : '']"
                            @click="card.clickable ? handleCounterClick(card.key) : null"
                        >
                            <p class="text-2xl font-black" :class="card.colorClass">
                                {{ card.value }}
                            </p>
                            <p class="text-[9px] font-bold text-[var(--color-secondary)] uppercase tracking-wide mt-0.5">
                                {{ card.label }}
                            </p>
                        </div>
                    </div>

                    <!-- Completion rate bar -->
                    <div class="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                        <div class="flex items-center justify-between mb-2">
                            <span class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest">
                                {{ $t('stats.status.completion_rate') }}
                            </span>
                            <span class="text-sm font-black" :class="rateColorClass">
                                {{ Math.round(store.stats.status.completion_rate * 100) }}%
                            </span>
                        </div>
                        <div class="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                            <div
                                class="h-full rounded-full transition-all duration-700"
                                :class="rateBarClass"
                                :style="{ width: `${Math.round(store.stats.status.completion_rate * 100)}%` }"
                            />
                        </div>
                    </div>

                    <!-- Categories health -->
                    <div class="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--color-border)]">
                        <p class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3">
                            {{ $t('stats.status.needs_attention') }}
                        </p>
                        <div v-if="attentionCategories.length" class="flex flex-wrap gap-2">
                            <button
                                v-for="cat in attentionCategories"
                                :key="cat.slug"
                                class="px-3 py-1.5 rounded-xl text-[11px] font-bold border transition-all hover:scale-105 cursor-pointer"
                                :style="{ backgroundColor: cat.color + '18', borderColor: cat.color + '40', color: cat.color }"
                                @click="goToCategory(cat.slug)"
                            >
                                {{ cat.name }}
                                <span class="opacity-60 ml-1">({{ cat.active }})</span>
                            </button>
                        </div>
                        <p v-else class="text-xs text-[var(--color-secondary)] italic">
                            {{ store.stats.status.active_tasks ? $t('stats.status.all_good') : $t('stats.status.no_active_tasks') }}
                        </p>
                    </div>
                </div>

                <!-- Counters Grid -->
                <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div
                        v-for="(val, key) in counters"
                        :key="key"
                        class="bg-[var(--bg-card)] p-4 rounded-3xl border border-[var(--color-border)] shadow-sm cursor-pointer hover:scale-105 transition-transform"
                        @click="handleCounterClick(key)"
                    >
                        <p class="text-[9px] font-black text-[var(--color-secondary)] uppercase tracking-widest mb-1">
                            {{ $t(`stats.counters.${key}`) }}
                        </p>
                        <p class="text-2xl font-black text-[var(--color-text)]">
                            {{ val }}
                        </p>
                    </div>
                </div>

                <!-- Heatmap Section -->
                <div class="space-y-4">
                    <div class="flex items-center justify-between px-1">
                        <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest">
                            {{ $t('stats.heatmap.title') }}
                        </h3>
                        <span class="text-[10px] text-[var(--color-secondary)] font-bold italic">{{ $t('stats.heatmap.subtitle') }}</span>
                    </div>
                    <div class="bg-[var(--bg-card)] p-4 rounded-[24px] border border-[var(--color-border)] overflow-x-auto scrollbar-hide shadow-sm">
                        <div class="flex gap-1 min-w-max">
                            <div v-for="week in heatmapWeeks" :key="week[0].date" class="flex flex-col gap-1">
                                <div
                                    v-for="day in week"
                                    :key="day.date"
                                    class="w-3 h-3 sm:w-4 sm:h-4 rounded-sm transition-all hover:scale-125 hover:z-10 cursor-pointer"
                                    :class="[getHeatmapClass(day.count), selectedDay === day.date ? 'ring-2 ring-[var(--color-text)] ring-offset-1' : '']"
                                    :title="`${day.date}: ${day.count} ${$t('stats.heatmap.completions')}`"
                                    @click="handleHeatmapClick(day)"
                                />
                            </div>
                        </div>
                    </div>

                    <!-- Selected day detail panel -->
                    <div
                        v-if="selectedDay"
                        class="bg-[var(--bg-card)] p-4 rounded-2xl border border-[var(--color-border)] shadow-sm"
                    >
                        <div class="flex items-center justify-between mb-3">
                            <div>
                                <span class="text-sm font-black text-[var(--color-text)]">{{ formatDateLocale(selectedDay) }}</span>
                                <span class="text-[10px] text-[var(--color-secondary)] ml-2">
                                    {{ dayCount }} {{ $t('stats.heatmap.completions') }}
                                </span>
                            </div>
                            <button
                                class="w-6 h-6 rounded-lg bg-[var(--bg-secondary)] flex items-center justify-center text-[var(--color-secondary)] hover:text-[var(--color-text)]"
                                @click="selectedDay = null"
                            >
                                ×
                            </button>
                        </div>

                        <div v-if="dayLoading" class="flex justify-center py-4">
                            <div class="w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                        </div>

                        <div v-else-if="dayCompletions.length" class="space-y-2">
                            <div
                                v-for="c in dayCompletions"
                                :key="c.id"
                                class="flex items-center justify-between p-2 bg-[var(--bg-secondary)]/50 rounded-xl"
                            >
                                <span class="text-sm font-bold text-[var(--color-text)] truncate flex-1 mr-3">{{ c.title }}</span>
                                <button
                                    class="shrink-0 px-2 py-1 rounded-lg text-[9px] font-bold uppercase tracking-wide border border-[var(--color-border)] text-[var(--color-secondary)] hover:text-[var(--color-text)] bg-[var(--bg-card)]"
                                    @click="goToCategory(c.category_slug)"
                                >
                                    {{ getCatName(c.category_slug) }}
                                </button>
                            </div>
                        </div>

                        <p v-else class="text-center py-3 text-xs text-[var(--color-secondary)] italic">
                            {{ $t('stats.heatmap.no_completions') }}
                        </p>
                    </div>
                </div>

                <!-- Balance Section -->
                <div class="space-y-4">
                    <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest px-1">
                        {{ $t('stats.balance.title') }}
                    </h3>
                    <div class="bg-[var(--bg-card)] p-6 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                        <div v-if="!store.stats.category_balance.length" class="text-center py-4 text-xs text-[var(--color-secondary)] italic">
                            {{ $t('stats.balance.no_data') }}
                        </div>
                        <div v-else class="space-y-5">
                            <div
                                v-for="item in sortedBalance"
                                :key="item.category_slug"
                                class="space-y-2 cursor-pointer group"
                                @click="goToCategory(item.category_slug)"
                            >
                                <div class="flex items-center justify-between text-[11px] font-bold">
                                    <span class="text-[var(--color-text)] group-hover:text-[var(--color-primary)] transition-colors">{{ getCatName(item.category_slug) }}</span>
                                    <span class="text-[var(--color-secondary)]">{{ item.count }}</span>
                                </div>
                                <div class="h-2 w-full bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full transition-all duration-1000 group-hover:opacity-80"
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
import { useI18n } from 'vue-i18n';
import axios from 'axios';
import AppIcon from '../components/AppIcon.vue';
import BaseButton from '../components/BaseButton.vue';

const store = useBalanceStore();
const router = useRouter();
const { t } = useI18n();
const loading = ref(true);

const selectedDay = ref(null);
const dayCompletions = ref([]);
const dayLoading = ref(false);
const dayCount = ref(0);

onMounted(async () => {
    await store.fetchStats();
    loading.value = false;
});

const counters = computed(() => store.stats?.counters || {});

const statusCards = computed(() => {
    const s = store.stats?.status;
    if (!s) return [];
    const cards = [
        { key: 'active_tasks', value: s.active_tasks, label: t('stats.status.active_tasks'), colorClass: 'text-blue-500', borderClass: 'border-[var(--color-border)]', clickable: false },
        { key: 'overdue_tasks', value: s.overdue_tasks, label: t('stats.status.overdue_tasks'), colorClass: s.overdue_tasks > 0 ? 'text-red-500' : 'text-[var(--color-secondary)]', borderClass: s.overdue_tasks > 0 ? 'border-red-500/30' : 'border-[var(--color-border)]', clickable: false },
        { key: 'postponed_tasks', value: s.postponed_tasks, label: t('stats.status.postponed_tasks'), colorClass: 'text-amber-500', borderClass: 'border-[var(--color-border)]', clickable: false },
        { key: 'hidden_tasks', value: s.hidden_tasks, label: t('stats.status.hidden_tasks'), colorClass: 'text-[var(--color-secondary)]', borderClass: 'border-[var(--color-border)]', clickable: false },
        { key: 'completed_today', value: s.completed_today, label: t('stats.status.completed_today'), colorClass: 'text-green-500', borderClass: s.completed_today > 0 ? 'border-green-500/30' : 'border-[var(--color-border)]', clickable: s.completed_today > 0 },
        { key: 'completion_rate', value: `${Math.round(s.completion_rate * 100)}%`, label: t('stats.status.completion_rate'), colorClass: rateColorClass.value, borderClass: 'border-[var(--color-border)]', clickable: false },
    ];
    return cards;
});

const rateColorClass = computed(() => {
    const r = store.stats?.status?.completion_rate ?? 0;
    if (r >= 0.5) return 'text-green-500';
    if (r >= 0.25) return 'text-amber-500';
    return 'text-red-500';
});

const rateBarClass = computed(() => {
    const r = store.stats?.status?.completion_rate ?? 0;
    if (r >= 0.5) return 'bg-green-500';
    if (r >= 0.25) return 'bg-amber-500';
    return 'bg-red-500';
});

const attentionCategories = computed(() => {
    const health = store.stats?.status?.categories_health;
    if (!health) return [];
    return Object.entries(health)
        .filter(([, h]) => h.needs_attention)
        .map(([slug, h]) => {
            const cat = store.categories.find(c => c.slug === slug);
            return {
                slug,
                name: cat?.name || slug,
                color: cat?.color || '#8e8e93',
                active: h.active,
            };
        });
});

const goToCategory = (slug) => {
    store.filterCat = slug;
    router.push('/');
};

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

const formatDateLocale = (dateStr) => {
    if (!dateStr) return '';
    const locale = store.locale === 'ru' ? 'ru-RU' : 'en-US';
    return new Date(dateStr).toLocaleDateString(locale, { day: '2-digit', month: '2-digit', year: 'numeric' });
};

const handleHeatmapClick = async (day) => {
    if (selectedDay.value === day.date) {
        selectedDay.value = null;
        return;
    }
    selectedDay.value = day.date;
    dayCount.value = day.count;

    if (day.count > 0) {
        dayLoading.value = true;
        try {
            const res = await axios.get(`stats?date=${day.date}`);
            dayCompletions.value = res.data.completions || [];
        } catch {
            dayCompletions.value = [];
        } finally {
            dayLoading.value = false;
        }
    } else {
        dayCompletions.value = [];
    }
};

const handleCounterClick = async (key) => {
    if (key === 'today' && counters.value.today > 0) {
        const today = new Date().toISOString().split('T')[0];
        if (selectedDay.value === today) {
            selectedDay.value = null;
            return;
        }
        selectedDay.value = today;
        dayCount.value = counters.value.today;
        dayLoading.value = true;
        try {
            const res = await axios.get(`stats?date=${today}`);
            dayCompletions.value = res.data.completions || [];
        } catch {
            dayCompletions.value = [];
        } finally {
            dayLoading.value = false;
        }
    }
};
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 4px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
