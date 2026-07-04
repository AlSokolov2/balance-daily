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

                <!-- Trends Section -->
                <div v-if="store.stats.trends" class="space-y-8">
                    <div class="flex items-center justify-between px-1">
                        <h3 class="text-xs font-black text-[var(--color-text)] uppercase tracking-widest">
                            {{ $t('stats.trends.title') }}
                        </h3>
                    </div>

                    <!-- Weekly Activity Line Chart -->
                    <div class="bg-[var(--bg-card)] p-5 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                        <h4 class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3 px-1">
                            {{ $t('stats.trends.weekly.title') }}
                        </h4>
                        <svg viewBox="0 0 300 100" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                            <!-- Grid lines -->
                            <line
                                v-for="y in 4"
                                :key="'grid-' + y"
                                :x1="0" :y1="y * 20" :x2="300" :y2="y * 20"
                                stroke="var(--color-border)" stroke-width="0.3" opacity="0.5"
                            />
                            <!-- Line -->
                            <polyline
                                :points="weeklyLinePoints"
                                fill="none"
                                stroke="#3B82F6"
                                stroke-width="2"
                                stroke-linecap="round"
                                stroke-linejoin="round"
                            />
                            <!-- Dots -->
                            <circle
                                v-for="(pt, i) in weeklyPoints"
                                :key="'dot-' + i"
                                :cx="pt.x"
                                :cy="pt.y"
                                r="2.5"
                                fill="#3B82F6"
                            />
                            <!-- Labels -->
                            <text
                                v-for="(pt, i) in weeklyPoints"
                                :key="'lbl-' + i"
                                :x="pt.x"
                                :y="98"
                                text-anchor="middle"
                                class="text-[7px]"
                                fill="var(--color-secondary)"
                            >{{ pt.label }}</text>
                        </svg>
                        <div class="flex justify-between mt-1 px-1">
                            <span class="text-[9px] text-[var(--color-secondary)] font-bold">{{ weeklyMin }}</span>
                            <span class="text-[9px] text-[var(--color-secondary)] font-bold">{{ weeklyMax }}</span>
                        </div>
                    </div>

                    <!-- Day-of-week + Hour-of-day row -->
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <!-- Day-of-week bars -->
                        <div class="bg-[var(--bg-card)] p-5 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                            <h4 class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3 px-1">
                                {{ $t('stats.trends.day_of_week.title') }}
                            </h4>
                            <svg viewBox="0 0 200 80" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                                <rect
                                    v-for="(bar, i) in dayOfWeekData"
                                    :key="'dow-' + i"
                                    :x="bar.x"
                                    :y="bar.y"
                                    :width="bar.w"
                                    :height="bar.h"
                                    :rx="2"
                                    :fill="bar.count > 0 ? '#3B82F6' : 'var(--color-border)'"
                                    :opacity="bar.count > 0 ? 0.3 + (bar.ratio * 0.7) : 0.2"
                                />
                                <text
                                    v-for="(bar, i) in dayOfWeekData"
                                    :key="'dowl-' + i"
                                    :x="bar.x + bar.w / 2"
                                    :y="78"
                                    text-anchor="middle"
                                    class="text-[7px] font-bold"
                                    fill="var(--color-secondary)"
                                >{{ bar.label }}</text>
                            </svg>
                        </div>

                        <!-- Hour-of-day heatmap -->
                        <div class="bg-[var(--bg-card)] p-5 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                            <h4 class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3 px-1">
                                {{ $t('stats.trends.hour_of_day.title') }}
                            </h4>
                            <svg viewBox="0 0 240 60" class="w-full h-auto" preserveAspectRatio="xMidYMid meet">
                                <rect
                                    v-for="(cell, i) in hourOfDayData"
                                    :key="'hod-' + i"
                                    :x="cell.x"
                                    :y="cell.y"
                                    :width="cell.w"
                                    :height="cell.h"
                                    :rx="1.5"
                                    :fill="cell.count > 0 ? '#3B82F6' : 'var(--color-border)'"
                                    :opacity="cell.opacity"
                                />
                                <!-- Labels for every 3 hours -->
                                <text
                                    v-for="label in hourLabels"
                                    :key="'hl-' + label.hour"
                                    :x="label.x + 4"
                                    :y="58"
                                    text-anchor="middle"
                                    class="text-[6px] font-bold"
                                    fill="var(--color-secondary)"
                                >{{ label.text }}</text>
                            </svg>
                        </div>
                    </div>

                    <!-- Subcategory Performance -->
                    <div class="bg-[var(--bg-card)] p-5 rounded-[24px] border border-[var(--color-border)] shadow-sm">
                        <h4 class="text-[10px] font-bold text-[var(--color-secondary)] uppercase tracking-widest mb-3 px-1">
                            {{ $t('stats.trends.subcategory.title') }}
                        </h4>
                        <div v-if="!store.stats.trends.subcategory.length" class="text-center py-4 text-xs text-[var(--color-secondary)] italic">
                            {{ $t('stats.trends.subcategory.no_data') }}
                        </div>
                        <div v-else class="space-y-3">
                            <div
                                v-for="item in store.stats.trends.subcategory"
                                :key="item.name"
                                class="flex items-center gap-3"
                            >
                                <span class="text-[11px] font-bold text-[var(--color-text)] w-24 truncate shrink-0">{{ item.name }}</span>
                                <div class="flex-1 h-2 bg-[var(--bg-secondary)] rounded-full overflow-hidden">
                                    <div
                                        class="h-full rounded-full bg-blue-500/60"
                                        :style="{ width: `${(item.count / subcategoryMax) * 100}%` }"
                                    />
                                </div>
                                <span class="text-[10px] font-bold text-[var(--color-secondary)] w-6 text-right shrink-0">{{ item.count }}</span>
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

// ── Trends charts ──

const weeklyPoints = computed(() => {
    const weekly = store.stats?.trends?.weekly || [];
    if (!weekly.length) return [];
    const max = Math.max(...weekly.map(w => w.count), 1);
    const chartWidth = 300;
    const chartHeight = 80;
    const stepX = chartWidth / (weekly.length - 1 || 1);

    return weekly.map((w, i) => ({
        x: i * stepX,
        y: chartHeight - (w.count / max) * chartHeight,
        label: w.week_start.substring(5), // MM-DD
        count: w.count,
    }));
});

const weeklyLinePoints = computed(() =>
    weeklyPoints.value.map(p => `${p.x},${p.y}`).join(' ')
);

const weeklyMin = computed(() => {
    const weekly = store.stats?.trends?.weekly || [];
    return weekly.length ? Math.min(...weekly.map(w => w.count)) : 0;
});

const weeklyMax = computed(() => {
    const weekly = store.stats?.trends?.weekly || [];
    return weekly.length ? Math.max(...weekly.map(w => w.count)) : 0;
});

const dayOfWeekData = computed(() => {
    const days = store.stats?.trends?.day_of_week || [];
    if (!days.length) return [];
    const dayLabels = ['stats.trends.day_of_week.sun', 'stats.trends.day_of_week.mon', 'stats.trends.day_of_week.tue', 'stats.trends.day_of_week.wed', 'stats.trends.day_of_week.thu', 'stats.trends.day_of_week.fri', 'stats.trends.day_of_week.sat'];
    const max = Math.max(...days.map(d => d.count), 1);
    const chartWidth = 200;
    const chartHeight = 60;
    const barW = (chartWidth / 7) - 4;

    return days.map((d, i) => {
        const h = Math.max(2, (d.count / max) * chartHeight);
        return {
            x: i * (chartWidth / 7) + 2,
            y: chartHeight - h,
            w: barW,
            h: h,
            count: d.count,
            ratio: max > 0 ? d.count / max : 0,
            label: t(dayLabels[d.day || i]),
        };
    });
});

const hourOfDayData = computed(() => {
    const hours = store.stats?.trends?.hour_of_day || [];
    if (!hours.length) return [];
    const max = Math.max(...hours.map(h => h.count), 1);
    const cols = 12;
    const rows = 2;
    const cellW = 240 / cols;
    const cellH = 40 / rows;
    const gap = 1;

    return hours.map((h) => {
        const col = h.hour % cols;
        const row = Math.floor(h.hour / cols);
        return {
            x: col * cellW + gap / 2,
            y: row * cellH + gap / 2,
            w: cellW - gap,
            h: cellH - gap,
            count: h.count,
            opacity: h.count > 0 ? 0.15 + (h.count / max) * 0.85 : 0.08,
        };
    });
});

const hourLabels = computed(() => {
    return [0, 3, 6, 9, 12, 15, 18, 21].map(h => ({
        hour: h,
        x: (h % 12) * (240 / 12),
        text: `${String(h).padStart(2, '0')}:00`,
    }));
});

const subcategoryMax = computed(() => {
    const sub = store.stats?.trends?.subcategory || [];
    return Math.max(...sub.map(s => s.count), 1);
});

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
