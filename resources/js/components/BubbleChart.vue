<template>
    <div ref="wrapper" class="bubble-wrapper relative w-full h-full transition-all duration-300"
         :class="{ 'zoomed overflow-visible z-40': store.bubbleZoom !== 1 }"
         @touchstart="handleTouchStart"
         @touchmove="handleTouchMove"
         @touchend="handleTouchEnd">
        <div ref="container" class="bubble-container relative w-full h-full transition-transform duration-300"
             :style="bubbleContainerStyle"
             @click="hideTooltip">
            <div v-for="t in store.bubbleTasks" 
                 :key="t.id" 
                 class="bubble absolute rounded-full flex items-center justify-center text-center font-medium p-1 cursor-default transition-all duration-500"
                 :style="getBubbleStyle(t)"
                 @mouseenter="!isTouchDevice && showTooltip($event, t)" 
                 @mouseleave="!isTouchDevice && hideTooltip()"
                 @click.stop="handleBubbleClick(t)"
                 @pointerdown="handlePointerDown($event, t)"
                 @pointerup="handlePointerUp($event, t)"
                 @pointercancel="handlePointerUp($event, t)"
                 @contextmenu.prevent>
                <span class="block leading-[1.1] break-words pointer-events-none">
                    {{ t.title }}
                </span>
            </div>
            
            <div v-if="!store.bubbleTasks.length" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[var(--color-secondary)] text-sm text-center px-6">
                <template v-if="store.filterCat === 'archive'">
                    {{ $t('app.archive_info') }}
                </template>
                <template v-else-if="store.filterCat === 'hidden'">
                    {{ $t('app.hidden_info') }}
                </template>
                <template v-else>
                    {{ $t('app.no_tasks') }}
                </template>
            </div>

            <div v-if="tooltip.visible" 
                 class="bubble-tooltip absolute z-[9999] bg-[#fffee0] border border-[#ccc] rounded-lg px-2 py-1 text-[9px] max-w-[180px] shadow-[0_4px_8px_rgba(0,0,0,0.15)] pointer-events-none whitespace-pre-wrap break-words"
                 :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
                {{ tooltip.text }}
            </div>
        </div>
        
        <!-- Индикатор расчета (Web Worker) -->
        <div v-if="isCalculating" class="absolute top-4 right-4 z-50">
            <div class="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent"></div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch } from 'vue';
import { useBalanceStore } from '../stores/balance';

const emit = defineEmits(['edit']);
const store = useBalanceStore();
const container = ref(null);
const wrapper = ref(null);
const bubblePositions = ref([]);
const isCalculating = ref(false);
const isTouchDevice = ref(false);
const tooltip = ref({ visible: false, text: '', x: 0, y: 0, taskId: null });

let worker = null;

const bubbleContainerStyle = computed(() => {
    if (store.bubbleZoom !== 1) {
        return {
            transform: `scale(${store.bubbleZoom})`,
            transformOrigin: 'center center'
        };
    }
    return {};
});

const getBubbleStyle = (task) => {
    const pos = bubblePositions.value.find(p => p.id === task.id);
    if (!pos) return { display: 'none' };
    
    const category = store.categories.find(c => c.slug === task.category_slug);
    const color = category?.color || '#8e8e93';
    const postponed = store.isEffectivelyPostponed(task) && !task.force_active;
    
    const s = pos.size;
    let fontSize = s < 50 ? Math.max(6, s / 12) : Math.max(8, s / 9);
    const borderWidth = (task.missed_count > 0) ? '3px' : '2px';

    return {
        width: s + 'px',
        height: s + 'px',
        left: (pos.x - s / 2) + 'px',
        top: (pos.y - s / 2) + 'px',
        background: hexToRgba(color, 0.25),
        border: `${borderWidth} solid ${color}`,
        opacity: postponed ? 0.4 : 1,
        fontSize: fontSize + 'px',
        color: 'var(--color-text)'
    };
};

function hexToRgba(hex, alpha) {
    if (!hex) return 'rgba(150,150,150,' + alpha + ')';
    hex = hex.replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);
    return `rgba(${r},${g},${b},${alpha})`;
}

const showTooltip = (event, task) => {
    if (!task.notes) return;
    const pos = bubblePositions.value.find(p => p.id === task.id);
    if (!pos || !container.value) return;

    const cw = container.value.clientWidth;
    const tooltipWidth = 180;
    let x = pos.x;
    let y = pos.y - pos.size / 2 - 12;

    if (pos.x + pos.size / 2 > cw - 20) {
        x = pos.x - tooltipWidth;
    }
    if (x < 5) x = 5;
    if (x + tooltipWidth > cw - 5) x = cw - tooltipWidth - 5;
    if (y < 5) y = 5;

    tooltip.value = { visible: true, text: task.notes, x, y, taskId: task.id };
};

const hideTooltip = () => {
    tooltip.value.visible = false;
    tooltip.value.taskId = null;
};

let touchTimer = null;
let touchMoved = false;
let isLongPress = false;

// Pinch zoom state
const initialPinchDist = ref(0);
const initialZoom = ref(1);

const getDistance = (t1, t2) => {
    return Math.sqrt(Math.pow(t2.clientX - t1.clientX, 2) + Math.pow(t2.clientY - t1.clientY, 2));
};

const handleTouchStart = (e) => {
    if (e.touches.length === 2) {
        initialPinchDist.value = getDistance(e.touches[0], e.touches[1]);
        initialZoom.value = store.bubbleZoom;
    }
};

const handleTouchMove = (e) => {
    if (e.touches.length === 2 && initialPinchDist.value > 0) {
        if (e.cancelable) e.preventDefault();
        const dist = getDistance(e.touches[0], e.touches[1]);
        const ratio = dist / initialPinchDist.value;
        let newZoom = initialZoom.value * ratio;
        newZoom = Math.max(0.5, Math.min(2, newZoom));
        store.bubbleZoom = parseFloat(newZoom.toFixed(2));
    }
};

const handleTouchEnd = (e) => {
    if (e.touches.length < 2) {
        initialPinchDist.value = 0;
    }
};

const handlePointerDown = (event, task) => {
    if (!isTouchDevice.value) return;
    touchMoved = false;
    isLongPress = false;
    touchTimer = setTimeout(() => {
        if (!touchMoved) {
            isLongPress = true;
            showTooltip(event, task);
        }
        touchTimer = null;
    }, 400);
};

const handlePointerUp = (event, task) => {
    if (!isTouchDevice.value) return;
    if (touchTimer) {
        clearTimeout(touchTimer);
        touchTimer = null;
    } else if (isLongPress) {
        hideTooltip();
    }
};

window.addEventListener('pointermove', () => { touchMoved = true; }, { passive: true });

const handleBubbleClick = (task) => {
    if (isTouchDevice.value) {
        if (!isLongPress) {
            emit('edit', task);
        }
        isLongPress = false;
    } else {
        emit('edit', task);
    }
};

const calcBubbles = () => {
    const T = store.bubbleTasks;
    if (!T.length) { bubblePositions.value = []; return; }
    if (!container.value || !worker) return;

    const W = container.value.clientWidth || 800; 
    const H = container.value.clientHeight || 600;
    if (!W || !H) return;

    const padding = 5;
    const maxP = T[0].calculatedPriority;
    const minP = T[T.length - 1].calculatedPriority;
    const rng = maxP - minP || 1;
    const baseSizes = T.map(t => 25 + ((t.calculatedPriority - minP) / rng) * 50);

    const central = [], side = [];
    T.forEach((t, i) => {
        const isSide = t.ha || (store.isEffectivelyPostponed(t) && !t.force_active);
        const data = { id: t.id, r: baseSizes[i] / 2, pri: t.calculatedPriority };
        if (isSide) side.push(data);
        else central.push(data);
    });

    isCalculating.value = true;
    if (worker) {
        worker.postMessage({
            central,
            side,
            W,
            H,
            isMobile: W < 600,
            padding
        });
    } else {
        isCalculating.value = false;
    }
};

defineExpose({ calcBubbles, bubblePositions, handlePointerDown, handlePointerUp, handleBubbleClick, handleTouchStart, handleTouchMove, handleTouchEnd, tooltip, isTouchDevice, container, isCalculating });

watch(() => store.bubbleTasks, calcBubbles, { deep: true });
watch(() => store.bubbleZoom, calcBubbles);
window.addEventListener('resize', calcBubbles);
onMounted(() => {
    isTouchDevice.value = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    
    if (typeof Worker !== 'undefined') {
        const baseUrl = (window.apiBaseUrl || '').replace(/\/$/, '');
        worker = new Worker(baseUrl + '/workers/packer.worker.js');
        
        worker.onmessage = (e) => {
            bubblePositions.value = e.data.bubblePositions;
            isCalculating.value = false;
        };
    }

    setTimeout(calcBubbles, 100);
});

onUnmounted(() => {
    window.removeEventListener('resize', calcBubbles);
    if (worker) worker.terminate();
});
</script>

<style scoped>
.bubble-wrapper {
    touch-action: auto;
}
.bubble {
    user-select: none;
    -webkit-touch-callout: none;
    transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}
.bubble span {
    display: block;
    white-space: normal;
    word-break: break-word;
    line-height: 1.1;
}
</style>
