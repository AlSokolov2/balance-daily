<template>
    <div class="relative w-full h-full p-1 overflow-hidden bg-[var(--bg-app)]">
        <div v-if="!tasks || tasks.length === 0" class="absolute inset-0 flex items-center justify-center opacity-50">
            <span class="text-[var(--color-secondary)] font-bold uppercase tracking-widest text-sm">
                {{ $t('app.no_tasks') }}
            </span>
        </div>
        <div v-else ref="container" class="relative w-full h-full">
            <!-- Group Backgrounds/Labels -->
            <div 
                v-for="zone in zoneLayouts" 
                :key="zone.id"
                class="absolute rounded-[2rem] border transition-all duration-500"
                :class="getZoneClass(zone.id)"
                :style="getZoneStyle(zone)"
            >
                <div class="absolute top-4 left-6 opacity-90 pointer-events-none">
                    <span 
                        class="text-[10px] font-black uppercase tracking-[0.3em] text-[var(--color-text)]"
                        style="text-shadow: -1px -1px 0 var(--bg-card), 1px -1px 0 var(--bg-card), -1px 1px 0 var(--bg-card), 1px 1px 0 var(--bg-card), 0 0 8px var(--bg-card);"
                    >
                        {{ $t(`app.sections.${zone.id}`) }}
                    </span>
                </div>
            </div>

            <!-- Task Blocks -->
            <div
                v-for="rect in treemapRects"
                :key="rect.task.id"
                class="absolute rounded-2xl flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden shadow-sm hover:z-10 hover:shadow-md hover:scale-[1.02] active:scale-95"
                :style="getStyle(rect)"
                @click="handleClick(rect.task)"
            >
                <div class="p-2 sm:p-4 text-center w-full max-w-full">
                    <span 
                        :class="[
                            'block font-black break-words leading-tight',
                            store.isEffectivelyPostponed(rect.task) && !rect.task.force_active 
                                ? 'text-[var(--color-text)] opacity-70' 
                                : 'text-white drop-shadow-md'
                        ]"
                        :style="{ fontSize: getFontSize(rect) }"
                    >
                        {{ rect.task.title }}
                    </span>
                    <span v-if="rect.task.importance === 3" class="text-[10px] sm:text-xs text-red-200 mt-1 block font-bold uppercase tracking-widest leading-none">
                        High Priority
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import { hexToRgba } from '../utils/colors';

const props = defineProps({
    tasks: { type: Array, default: null }
});

const router = useRouter();
const store = useBalanceStore();
const container = ref(null);
const dimensions = ref({ width: 0, height: 0 });
let resizeObserver = null;

const updateDimensions = () => {
    if (container.value) {
        dimensions.value = {
            width: container.value.clientWidth,
            height: container.value.clientHeight
        };
    }
};

onMounted(() => {
    updateDimensions();
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(updateDimensions);
        if (container.value) resizeObserver.observe(container.value);
    } else {
        window.addEventListener('resize', updateDimensions);
    }
});

onUnmounted(() => {
    if (resizeObserver) resizeObserver.disconnect();
    else window.removeEventListener('resize', updateDimensions);
});

// --- Grouping Logic ---

const groupedTasks = computed(() => {
    const tasks = props.tasks || store.bubbleTasks;
    const focus = [];
    const plans = [];
    const routine = [];

    tasks.forEach(t => {
        if (store.isEffectivelyPostponed(t)) plans.push(t);
        else if (t.ha) routine.push(t);
        else focus.push(t);
    });

    return { focus, plans, routine };
});

const zoneLayouts = computed(() => {
    const { width: W, height: H } = dimensions.value;
    if (W === 0 || H === 0) return [];

    // Flat mode just returns one single zone for all tasks
    if (store.treemapMode === 'flat') {
        return [{ id: 'all', x: 0, y: 0, w: W, h: H }];
    }

    const groups = groupedTasks.value;
    const getWeight = (tasks) => tasks.reduce((s, t) => s + Math.pow(Math.max(0.1, t.calculatedPriority), store.treemapScale), 0);
    
    const weights = {
        plans: getWeight(groups.plans),
        focus: getWeight(groups.focus),
        routine: getWeight(groups.routine)
    };
    
    const totalWeight = weights.plans + weights.focus + weights.routine;
    if (totalWeight === 0) return [];

    const isVertical = W < H;
    const zones = [];
    let offset = 0;

    // We want: [Plans] [Focus] [Routine]
    ['plans', 'focus', 'routine'].forEach(id => {
        const ratio = weights[id] / totalWeight;
        const size = (isVertical ? H : W) * ratio;
        
        zones.push({
            id,
            x: isVertical ? 0 : offset,
            y: isVertical ? offset : 0,
            w: isVertical ? W : size,
            h: isVertical ? size : H
        });
        offset += size;
    });

    return zones;
});

// --- Treemap Algorithms ---

const squarify = (tasks, x, y, w, h) => {
    if (tasks.length === 0 || w <= 0 || h <= 0) return [];
    
    // Use exponential scaling for weights
    const getPriority = (t) => Math.pow(Math.max(0.1, t.calculatedPriority), store.treemapScale);
    const totalWeight = tasks.reduce((sum, t) => sum + getPriority(t), 0);
    const totalArea = w * h;
    const tasksWithArea = tasks.map(t => ({
        task: t,
        area: (getPriority(t) / totalWeight) * totalArea
    }));

    return layout(tasksWithArea, [], { x, y, w, h });
};

/**
 * Custom logic for the Focus group to put the biggest task in the center.
 */
const centerLayout = (tasks, x, y, w, h) => {
    if (tasks.length === 0) return [];
    if (tasks.length === 1) return [{ task: tasks[0], x, y, w, h }];

    const sorted = [...tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
    const main = sorted[0];
    const others = sorted.slice(1);

    const getPriority = (t) => Math.pow(Math.max(0.1, t.calculatedPriority), store.treemapScale);

    // Split others into two roughly equal weight groups
    const halfWeight = others.reduce((s, t) => s + getPriority(t), 0) / 2;
    let current = 0;
    let splitIdx = 0;
    for (let i = 0; i < others.length; i++) {
        current += getPriority(others[i]);
        if (current >= halfWeight) { splitIdx = i; break; }
    }

    const group1 = others.slice(0, splitIdx + 1);
    const group2 = others.slice(splitIdx + 1);

    const totalWeight = tasks.reduce((s, t) => s + getPriority(t), 0);
    const isVertical = w < h;

    // Divide container into 3 slices along the longer side: [Group1] [Main] [Group2]
    const r1 = group1.reduce((s, t) => s + getPriority(t), 0) / totalWeight;
    const rMain = getPriority(main) / totalWeight;
    
    const s1 = (isVertical ? h : w) * r1;
    const sMain = (isVertical ? h : w) * rMain;
    const s2 = (isVertical ? h : w) - s1 - sMain;

    let rects = [];
    // Slice 1
    rects = rects.concat(squarify(group1, x, y, isVertical ? w : s1, isVertical ? s1 : h));
    // Slice 2 (Main)
    rects.push({ task: main, x: isVertical ? x : x + s1, y: isVertical ? y + s1 : y, w: isVertical ? w : sMain, h: isVertical ? sMain : h });
    // Slice 3
    rects = rects.concat(squarify(group2, isVertical ? x : x + s1 + sMain, isVertical ? y + s1 + sMain : y, isVertical ? w : s2, isVertical ? s2 : h));

    return rects;
};


const layout = (tasks, row, container) => {
    if (tasks.length === 0) return row.length > 0 ? layoutRow(row, container) : [];
    const nextTask = tasks[0];
    const newRow = [...row, nextTask];
    if (worstAspectRatio(row, container) >= worstAspectRatio(newRow, container)) return layout(tasks.slice(1), newRow, container);
    else {
        const rowRects = layoutRow(row, container);
        return [...rowRects, ...layout(tasks, [], getRemainingContainer(row, container))];
    }
};

const worstAspectRatio = (row, container) => {
    if (row.length === 0) return Infinity;
    const rowArea = row.reduce((sum, t) => sum + t.area, 0);
    const side = Math.min(container.w, container.h);
    if (side === 0) return Infinity;
    const minArea = Math.min(...row.map(t => t.area));
    const maxArea = Math.max(...row.map(t => t.area));
    return Math.max((side * side * maxArea) / (rowArea * rowArea), (rowArea * rowArea) / (side * side * minArea));
};

const layoutRow = (row, container) => {
    const rowArea = row.reduce((sum, t) => sum + t.area, 0);
    const vertical = container.w < container.h;
    const side = Math.min(container.w, container.h);
    const rowThickness = side > 0 ? rowArea / side : 0;
    let offset = 0;
    return row.map(t => {
        const length = rowThickness > 0 ? t.area / rowThickness : 0;
        const rect = vertical 
            ? { task: t.task, x: container.x + offset, y: container.y, w: length, h: rowThickness }
            : { task: t.task, x: container.x, y: container.y + offset, w: rowThickness, h: length };
        offset += length;
        return rect;
    });
};

const getRemainingContainer = (row, container) => {
    const rowArea = row.reduce((sum, t) => sum + t.area, 0);
    const vertical = container.w < container.h;
    const side = Math.min(container.w, container.h);
    const rowThickness = side > 0 ? rowArea / side : 0;
    return vertical 
        ? { x: container.x, y: container.y + rowThickness, w: container.w, h: Math.max(0, container.h - rowThickness) }
        : { x: container.x + rowThickness, y: container.y, w: Math.max(0, container.w - rowThickness), h: container.h };
};

const treemapRects = computed(() => {
    if (dimensions.value.width === 0) return [];
    
    let rects = [];
    zoneLayouts.value.forEach(zone => {
        const tasks = store.treemapMode === 'flat' ? (props.tasks || store.bubbleTasks) : groupedTasks.value[zone.id];
        if (tasks.length === 0) return;

        const sorted = [...tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
        
        // Use custom center layout for Focus group in nested/airy modes
        const zoneRects = (zone.id === 'focus' && store.treemapMode !== 'flat')
            ? centerLayout(sorted, zone.x, zone.y, zone.w, zone.h)
            : squarify(sorted, zone.x, zone.y, zone.w, zone.h);
            
        rects = rects.concat(zoneRects);
    });

    const padding = store.treemapMode === 'airy' ? 10 : 4;
    return rects.map(r => ({
        ...r,
        x: r.x + padding / 2,
        y: r.y + padding / 2,
        w: Math.max(0, r.w - padding),
        h: Math.max(0, r.h - padding)
    }));
});

// --- Visual Helpers ---

const getZoneClass = (id) => {
    return {
        'bg-[var(--bg-secondary)]/10 border-dashed border-[var(--color-border)]/20': id === 'plans',
        'bg-[var(--color-primary)]/10 border-solid border-[var(--color-primary)]/15 shadow-inner': id === 'focus',
        'bg-black/5 dark:bg-white/10 border-dotted border-[var(--color-border)]/20': id === 'routine'
    };
};

const getZoneStyle = (zone) => ({
    left: `${zone.x + 2}px`,
    top: `${zone.y + 2}px`,
    width: `${zone.w - 4}px`,
    height: `${zone.h - 4}px`
});

const getStyle = (rect) => {
    const category = store.categories.find(c => c.slug === rect.task.category_slug);
    const color = category?.color || '#8e8e93';
    const postponed = store.isEffectivelyPostponed(rect.task) && !rect.task.force_active;
    const isMissed = rect.task.missed_count > 0;
    const borderColor = isMissed ? 'rgba(239,68,68,0.8)' : hexToRgba(color, 0.4);

    return {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`,
        backgroundColor: hexToRgba(color, postponed ? 0.15 : 0.85),
        border: `${isMissed ? 3 : 2}px ${postponed ? 'dashed' : 'solid'} ${borderColor}`,
        boxShadow: isMissed ? '0 0 6px rgba(239,68,68,0.5)' : 'none',
    };
};

const getFontSize = (rect) => {
    const area = Math.max(0, rect.w) * Math.max(0, rect.h);
    return `${Math.max(9, Math.min(28, Math.sqrt(area) / 7.5))}px`;
};

const handleClick = (task) => {
    router.push(`/task/${task.id}`);
};
</script>

<style scoped>
@reference "../../css/app.css";
</style>