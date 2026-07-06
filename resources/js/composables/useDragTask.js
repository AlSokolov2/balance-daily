/**
 * Touch-friendly drag-and-drop via Pointer Events.
 *
 * Uses a movement threshold to distinguish drag (vertical) from
 * scroll/swipe (horizontal), so both coexist on touch devices.
 *
 * Usage in a card component:
 *   const { onTaskPointerDown } = useDragTask();
 *   // Task item:  @pointerdown="onTaskPointerDown(task, quadrant, $event)"
 *   // Drop zone:  data-drop-zone="q1"
 *   // Listen:     watch(lastDrop, (r) => { if (r) emitMove(r); })
 */

import { ref, shallowRef, onUnmounted } from 'vue';

const DRAG_THRESHOLD = 5; // px of movement before drag activates

/** @type {import('vue').Ref<{taskId: number, fromZone: string}|null>} */
const dragData = ref(null);

/** @type {import('vue').Ref<string|null>} */
const dragOverZone = ref(null);

/** @type {import('vue').ShallowRef<{taskId: number, fromZone: string, toZone: string}|null>} */
const lastDrop = shallowRef(null);

/** Track pointer origin to apply threshold */
let startX = 0;
let startY = 0;
let didStartDrag = false;

function resetState() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);
    dragData.value = null;
    dragOverZone.value = null;
    didStartDrag = false;
}

function onPointerMove(event) {
    const dx = Math.abs(event.clientX - startX);
    const dy = Math.abs(event.clientY - startY);

    if (!didStartDrag) {
        // Not yet dragging — wait for threshold
        if (dx + dy < DRAG_THRESHOLD) return;

        // Movement detected. If mostly horizontal, let swipe win.
        if (dx > dy) {
            resetState();
            return;
        }

        // Vertical movement — activate drag
        didStartDrag = true;
        event.preventDefault();
    }

    // Track which drop zone the pointer is over
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const zoneEl = el?.closest('[data-drop-zone]');
    dragOverZone.value = zoneEl?.dataset.dropZone || null;
}

function onPointerUp() {
    if (didStartDrag && dragData.value && dragOverZone.value &&
        dragOverZone.value !== dragData.value.fromZone) {
        lastDrop.value = {
            taskId: dragData.value.taskId,
            fromZone: dragData.value.fromZone,
            toZone: dragOverZone.value,
        };
    }

    resetState();
}

export function useDragTask() {
    function onTaskPointerDown(task, zoneKey, event) {
        // Only respond to primary pointer (not right-click)
        if (event.pointerType === 'mouse' && event.button !== 0) return;

        // Record origin but don't prevent default yet — wait for movement
        startX = event.clientX;
        startY = event.clientY;
        didStartDrag = false;
        dragData.value = { taskId: task.id, fromZone: zoneKey };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }

    onUnmounted(() => {
        resetState();
    });

    return {
        dragOverZone,
        dragData,
        lastDrop,
        onTaskPointerDown,
    };
}
