<template>
    <div class="relative w-full h-full p-2 overflow-hidden bg-[var(--bg-card)]">
        <div v-if="!tasks || tasks.length === 0" class="absolute inset-0 flex items-center justify-center opacity-50">
            <span class="text-[var(--color-secondary)] font-bold uppercase tracking-widest text-sm">
                {{ $t('app.no_tasks') }}
            </span>
        </div>
        <div v-else ref="container" class="relative w-full h-full">
            <div
                v-for="rect in treemapRects"
                :key="rect.task.id"
                class="absolute rounded-2xl border border-black/10 flex items-center justify-center cursor-pointer transition-all duration-300 overflow-hidden shadow-sm hover:z-10 hover:shadow-md hover:scale-[1.02] active:scale-95"
                :style="getStyle(rect)"
                @click="handleClick(rect.task)"
            >
                <div class="p-2 sm:p-4 text-center w-full max-w-full">
                    <span 
                        class="block font-black text-white mix-blend-overlay drop-shadow-md truncate"
                        :style="{ fontSize: getFontSize(rect) }"
                    >
                        {{ rect.task.title }}
                    </span>
                    <span v-if="rect.task.importance === 3" class="text-[10px] sm:text-xs text-red-200 mt-1 block font-bold uppercase tracking-widest">
                        High Priority
                    </span>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import { useRouter } from 'vue-router';
import { useBalanceStore } from '../stores/balance';
import { hexToRgba } from '../utils/colors';

const props = defineProps({
    tasks: { type: Array, default: null }
});

const router = useRouter();
const store = useBalanceStore();
const container = ref(null);
const dimensions = ref({ width: 100, height: 100 }); // Default non-zero to prevent initial empty array if observer is slow
let resizeObserver = null;

const updateDimensions = () => {
    if (container.value && container.value.clientWidth > 0 && container.value.clientHeight > 0) {
        const newWidth = container.value.clientWidth;
        const newHeight = container.value.clientHeight;
        if (dimensions.value.width !== newWidth || dimensions.value.height !== newHeight) {
            dimensions.value = { width: newWidth, height: newHeight };
        }
    }
};

onMounted(() => {
    updateDimensions();
    if (window.ResizeObserver) {
        resizeObserver = new ResizeObserver(() => {
            updateDimensions();
        });
        if (container.value) {
            resizeObserver.observe(container.value);
        }
    } else {
        window.addEventListener('resize', updateDimensions);
    }
});

onUnmounted(() => {
    if (resizeObserver) {
        resizeObserver.disconnect();
    } else {
        window.removeEventListener('resize', updateDimensions);
    }
});

watch(() => container.value, (newVal) => {
    if (newVal) {
        updateDimensions();
        if (resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver.observe(newVal);
        }
    }
});

const calculateTreemap = (tasks, x, y, w, h, vertical) => {
    if (tasks.length === 0) return [];
    if (tasks.length === 1) {
        return [{ task: tasks[0], x, y, w, h }];
    }

    const totalWeight = tasks.reduce((sum, t) => sum + Math.max(0.1, t.calculatedPriority), 0);
    
    let currentWeight = 0;
    let splitIndex = 0;
    for (let i = 0; i < tasks.length - 1; i++) {
        currentWeight += Math.max(0.1, tasks[i].calculatedPriority);
        if (currentWeight >= totalWeight / 2) {
            splitIndex = i;
            break;
        }
    }
    
    // Ensure splitIndex is valid and guarantees both groups have at least 1 item
    if (splitIndex < 0) splitIndex = 0;
    if (splitIndex >= tasks.length - 1) splitIndex = tasks.length - 2;

    const group1 = tasks.slice(0, splitIndex + 1);
    const group2 = tasks.slice(splitIndex + 1);
    
    const weight1 = group1.reduce((sum, t) => sum + Math.max(0.1, t.calculatedPriority), 0);
    const ratio = weight1 / totalWeight;

    let rects = [];
    if (vertical) {
        const splitY = h * ratio;
        rects = rects.concat(calculateTreemap(group1, x, y, w, splitY, !vertical));
        rects = rects.concat(calculateTreemap(group2, x, y + splitY, w, h - splitY, !vertical));
    } else {
        const splitX = w * ratio;
        rects = rects.concat(calculateTreemap(group1, x, y, splitX, h, !vertical));
        rects = rects.concat(calculateTreemap(group2, x + splitX, y, w - splitX, h, !vertical));
    }
    return rects;
};

const treemapRects = computed(() => {
    if (!props.tasks || props.tasks.length === 0 || dimensions.value.width === 0) return [];
    
    // Sort tasks by priority descending for better layout stability
    const sortedTasks = [...props.tasks].sort((a, b) => b.calculatedPriority - a.calculatedPriority);
    
    const padding = 4; // internal padding between rects
    const rects = calculateTreemap(sortedTasks, 0, 0, dimensions.value.width, dimensions.value.height, dimensions.value.width > dimensions.value.height);
    
    // Apply padding
    return rects.map(r => ({
        ...r,
        x: r.x + padding / 2,
        y: r.y + padding / 2,
        w: r.w - padding,
        h: r.h - padding
    }));
});

const getTaskColorStyle = (task) => {
    const category = store.categories.find(c => c.slug === task.category_slug);
    const color = category?.color || '#8e8e93';
    return hexToRgba(color, 0.8);
};

const getStyle = (rect) => {
    return {
        left: `${rect.x}px`,
        top: `${rect.y}px`,
        width: `${rect.w}px`,
        height: `${rect.h}px`,
        backgroundColor: getTaskColorStyle(rect.task)
    };
};

const getFontSize = (rect) => {
    const area = Math.max(0, rect.w) * Math.max(0, rect.h);
    const size = Math.max(10, Math.min(32, Math.sqrt(area) / 6));
    return `${size}px`;
};

const handleClick = (task) => {
    // If not touch or no long press logic needed, just push
    router.push(`/task/${task.id}`);
};

watch(() => props.tasks, () => {
    updateDimensions();
}, { deep: true });
</script>
