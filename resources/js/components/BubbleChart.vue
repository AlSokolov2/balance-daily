<template>
    <div ref="wrapper" class="bubble-wrapper relative w-full h-full transition-all duration-300"
         :class="{ 'zoomed overflow-visible z-40': store.bubbleZoom !== 1 }">
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
            
            <div v-if="!store.bubbleTasks.length" class="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[#8e8e93] text-sm">
                Нет задач
            </div>

            <div v-if="tooltip.visible" 
                 class="bubble-tooltip absolute z-[9999] bg-[#fffee0] border border-[#ccc] rounded-lg px-2 py-1 text-[9px] max-w-[180px] shadow-[0_4px_8px_rgba(0,0,0,0.15)] pointer-events-none whitespace-pre-wrap break-words"
                 :style="{ left: tooltip.x + 'px', top: tooltip.y + 'px' }">
                {{ tooltip.text }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, computed } from 'vue';
import { useBalanceStore } from '../stores/balance';

const emit = defineEmits(['edit']);
const store = useBalanceStore();
const wrapper = ref(null);
const container = ref(null);
const bubblePositions = ref([]);
const tooltip = ref({ visible: false, text: '', x: 0, y: 0, taskId: null });
const isTouchDevice = ref(false);

const bubbleContainerStyle = computed(() => {
    if (store.bubbleZoom !== 1) {
        return {
            transform: `scale(${store.bubbleZoom})`,
            transformOrigin: 'center center',
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
        color: '#1c1c1e'
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
    }, 400); // 400ms for long press
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

// Listen for pointermove to cancel long press if user is scrolling
window.addEventListener('pointermove', () => { touchMoved = true; }, { passive: true });

const handleBubbleClick = (task) => {
    if (isTouchDevice.value) {
        // Если это был длинный тап, клик игнорируем (тултип уже открыт)
        if (!isLongPress) {
            emit('edit', task);
        }
        isLongPress = false; // reset
    } else {
        // Десктоп: обычный клик всегда редактирование
        emit('edit', task);
    }
};

const calcBubbles = () => {
    const T = store.bubbleTasks;
    if (!T.length) { bubblePositions.value = []; return; }
    if (!container.value) return;

    const W = container.value.clientWidth || 800; // Fallback for tests
    const H = container.value.clientHeight || 600; // Fallback for tests
    if (!W || !H) return;

    const padding = 5;
    const maxP = T[0].calculatedPriority;
    const minP = T[T.length - 1].calculatedPriority;
    const rng = maxP - minP || 1;
    const baseSizes = T.map(t => 25 + ((t.calculatedPriority - minP) / rng) * 50);

    const central = [], side = [];
    T.forEach((t, i) => {
        const isSide = t.ha || (store.isEffectivelyPostponed(t) && !t.force_active);
        if (isSide) side.push({ task: t, r: baseSizes[i] / 2, pri: t.calculatedPriority });
        else central.push({ task: t, r: baseSizes[i] / 2, pri: t.calculatedPriority });
    });

    const isOverlap = (x, y, r, placed) => {
        for (let j = 0; j < placed.length; j++) {
            const p = placed[j];
            const dx = x - p.x, dy = y - p.y;
            if (Math.sqrt(dx * dx + dy * dy) < r + p.r + 2) return true;
        }
        return false;
    };

    const packGroup = (tasks, left, top, right, bottom, scale) => {
        const width = right - left, height = bottom - top;
        const centerX = left + width / 2, centerY = top + height / 2;
        const sizedTasks = tasks.map(item => ({ task: item.task, r: item.r * scale, pri: item.pri }))
                                .sort((a, b) => b.r - a.r);
        const placed = [];
        for (let i = 0; i < sizedTasks.length; i++) {
            const it = sizedTasks[i];
            let r = it.r, found = false, bestX, bestY;
            const maxDistX = width / 2 - r - padding, maxDistY = height / 2 - r - padding;
            const maxDist = Math.min(maxDistX, maxDistY);
            
            for (let dist = 0; dist <= maxDist; dist += 2) {
                const steps = Math.max(8, Math.floor(2 * Math.PI * dist / (r * 0.6)));
                for (let step = 0; step < steps; step++) {
                    const ang = (step / steps) * 2 * Math.PI;
                    const x = centerX + Math.cos(ang) * dist, y = centerY + Math.sin(ang) * dist;
                    if (x - r < left + padding || x + r > right - padding || y - r < top + padding || y + r > bottom - padding) continue;
                    if (!isOverlap(x, y, r, placed)) { bestX = x; bestY = y; found = true; break; }
                }
                if (found) break;
            }
            if (!found) {
                let shrunk = false;
                for (let shrink = 0; shrink <= r * 0.2; shrink += 2) {
                    let newR = r - shrink;
                    if (newR < 10) break;
                    const maxDist2 = Math.min(width/2 - newR - padding, height/2 - newR - padding);
                    for (let dist2 = 0; dist2 <= maxDist2; dist2 += 2) {
                        const steps2 = Math.max(8, Math.floor(2 * Math.PI * dist2 / (newR * 0.6)));
                        for (let step2 = 0; step2 < steps2; step2++) {
                            const ang2 = (step2 / steps2) * 2 * Math.PI;
                            const x2 = centerX + Math.cos(ang2) * dist2, y2 = centerY + Math.sin(ang2) * dist2;
                            if (x2 - newR < left + padding || x2 + newR > right - padding || y2 - newR < top + padding || y2 + newR > bottom - padding) continue;
                            if (!isOverlap(x2, y2, newR, placed)) { bestX = x2; bestY = y2; r = newR; found = shrunk = true; break; }
                        }
                        if (shrunk) break;
                    }
                    if (shrunk) break;
                }
                if (!shrunk) return null;
            }
            placed.push({ x: bestX, y: bestY, r: r, id: it.task.id, size: r * 2 });
        }
        return placed;
    };

    let bestPlaced = null, scale = 1.2;
    const isMobile = W < 600;

    while (scale > 0.3) {
        let centralPlaced = [], leftPlaced = [], rightPlaced = [], ok = true;

        if (isMobile) {
            // На мобилках разделяем на три горизонтальных ряда (равные доли)
            const hPart = (H - padding * 2) / 3;
            const side1 = [], side2 = [];
            side.forEach((s, i) => i % 2 === 0 ? side1.push(s) : side2.push(s));
            
            let topPlaced = [], midPlaced = [], botPlaced = [];
            
            if (side1.length > 0) {
                topPlaced = packGroup(side1, padding, padding, W - padding, padding + hPart, scale);
                if (!topPlaced) ok = false;
            }
            if (ok && central.length > 0) {
                midPlaced = packGroup(central, padding, padding + hPart, W - padding, padding + hPart * 2, scale);
                if (!midPlaced) ok = false;
            }
            if (ok && side2.length > 0) {
                botPlaced = packGroup(side2, padding, padding + hPart * 2, W - padding, H - padding, scale);
                if (!botPlaced) ok = false;
            }
            
            if (ok) {
                centralPlaced = (topPlaced || []).concat(midPlaced || [], botPlaced || []);
            }
        } else {
            if (central.length > 0) {
                centralPlaced = packGroup(central, (W - W * 0.4) / 2, padding, (W + W * 0.4) / 2, H - padding, scale);
                if (!centralPlaced) ok = false;
            }
            if (!ok) { scale -= 0.02; continue; }

            const cLeft = (W - W * 0.4) / 2, cRight = (W + W * 0.4) / 2;
            if (side.length > 0) {
                const leftTasks = [], rightTasks = [];
                side.forEach((s, i) => i % 2 === 0 ? leftTasks.push(s) : rightTasks.push(s));
                if (leftTasks.length > 0) {
                    leftPlaced = packGroup(leftTasks, padding, padding, cLeft - padding, H - padding, scale);
                    if (!leftPlaced) ok = false;
                }
                if (ok && rightTasks.length > 0) {
                    rightPlaced = packGroup(rightTasks, cRight + padding, padding, W - padding, H - padding, scale);
                    if (!rightPlaced) ok = false;
                }
            }
        }
        
        if (!ok) { scale -= 0.02; continue; }

        // Shift logic only for desktop (3 columns)
        let allPlaced = (centralPlaced || []).concat(leftPlaced || [], rightPlaced || []);
        if (!isMobile && allPlaced.length > 0) {
            let cLA, cRA;
            if (centralPlaced && centralPlaced.length > 0) {
                let minCX = Infinity, maxCX = -Infinity;
                centralPlaced.forEach(p => {
                    if (p.x - p.r < minCX) minCX = p.x - p.r;
                    if (p.x + p.r > maxCX) maxCX = p.x + p.r;
                });
                cLA = minCX; cRA = maxCX;
            } else {
                cLA = W / 2; cRA = W / 2;
            }
            const smallestD = Math.min(...allPlaced.map(p => p.r * 2), 10);
            if (leftPlaced && leftPlaced.length > 0) {
                const maxRL = Math.max(...leftPlaced.map(p => p.x + p.r));
                let dx = cLA - smallestD - maxRL;
                if (dx > 0) {
                    const minLeftA = Math.min(...leftPlaced.map(p => p.x + dx - p.r));
                    if (minLeftA < padding) dx -= (padding - minLeftA);
                    if (dx > 0) leftPlaced.forEach(p => { p.x += dx; });
                }
            }
            if (rightPlaced && rightPlaced.length > 0) {
                const minLR = Math.min(...rightPlaced.map(p => p.x - p.r));
                let dx = cRA + smallestD - minLR;
                if (dx < 0) {
                    let shift = -dx;
                    const maxRA = Math.max(...rightPlaced.map(p => p.x - shift + p.r));
                    if (maxRA > W - padding) shift -= (maxRA - (W - padding));
                    if (shift > 0) rightPlaced.forEach(p => { p.x -= shift; });
                }
            }
        }

        allPlaced = (centralPlaced || []).concat(leftPlaced || [], rightPlaced || []);
        // Auto-zoom from ref
        if (allPlaced.length > 0) {
            let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
            allPlaced.forEach(p => {
                if (p.x - p.r < minX) minX = p.x - p.r;
                if (p.x + p.r > maxX) maxX = p.x + p.r;
                if (p.y - p.r < minY) minY = p.y - p.r;
                if (p.y + p.r > maxY) maxY = p.y + p.r;
            });
            const cx = (minX + maxX) / 2, cy = (minY + maxY) / 2;
            const usedW = maxX - minX, usedH = maxY - minY;
            if (usedW > 0 && usedH > 0) {
                const availW = W - padding * 2, availH = H - padding * 2;
                const zoom = Math.min(availW / usedW, availH / usedH);
                if (zoom > 1.0) {
                    allPlaced = allPlaced.map(p => {
                        let nx = W / 2 + (p.x - cx) * zoom;
                        let ny = H / 2 + (p.y - cy) * zoom;
                        let nr = p.r * zoom;
                        nx = Math.max(padding + nr, Math.min(W - padding - nr, nx));
                        ny = Math.max(padding + nr, Math.min(H - padding - nr, ny));
                        return { x: nx, y: ny, r: nr, id: p.id, size: nr * 2 };
                    });
                }
            }
        }
        bestPlaced = allPlaced;
        break;
    }
    bubblePositions.value = bestPlaced || [];
};

defineExpose({ calcBubbles, bubblePositions, handlePointerDown, handlePointerUp, handleBubbleClick, tooltip, isTouchDevice, container });

watch(() => store.bubbleTasks, calcBubbles, { deep: true });
watch(() => store.bubbleZoom, calcBubbles);
window.addEventListener('resize', calcBubbles);

onMounted(() => {
    isTouchDevice.value = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    setTimeout(calcBubbles, 100);
});

onUnmounted(() => {
    window.removeEventListener('resize', calcBubbles);
});
</script>

<style scoped>
.bubble-wrapper {
    touch-action: pan-y;
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
