/**
 * Touch-friendly drag-and-drop via Pointer Events.
 *
 * Drag is triggered only from a dedicated drag handle (⋮⋮) on each task.
 * The handle has `touch-action: none` so the browser doesn't scroll/swipe
 * when touching it. The rest of the task item behaves normally.
 *
 * Usage in a card component:
 *   const { onTaskPointerDown } = useDragTask();
 *   // Drag handle:  @pointerdown="onTaskPointerDown(task, quadrant, $event)"
 *   // Drop zone:    data-drop-zone="q1"
 *   // Listen:       watch(lastDrop, (r) => { if (r) emitMove(r); })
 */

import { ref, shallowRef, onUnmounted } from 'vue';

/** @type {import('vue').Ref<{taskId: number, fromZone: string}|null>} */
const dragData = ref(null);

/** @type {import('vue').Ref<string|null>} */
const dragOverZone = ref(null);

/** @type {import('vue').ShallowRef<{taskId: number, fromZone: string, toZone: string}|null>} */
const lastDrop = shallowRef(null);

function onPointerMove(event) {
    const el = document.elementFromPoint(event.clientX, event.clientY);
    const zoneEl = el?.closest('[data-drop-zone]');
    dragOverZone.value = zoneEl?.dataset.dropZone || null;
}

function onPointerUp() {
    document.removeEventListener('pointermove', onPointerMove);
    document.removeEventListener('pointerup', onPointerUp);

    if (dragData.value && dragOverZone.value &&
        dragOverZone.value !== dragData.value.fromZone) {
        lastDrop.value = {
            taskId: dragData.value.taskId,
            fromZone: dragData.value.fromZone,
            toZone: dragOverZone.value,
        };
    }

    dragData.value = null;
    dragOverZone.value = null;
}

export function useDragTask() {
    function onTaskPointerDown(task, zoneKey, event) {
        // Only primary pointer, not right-click
        if (event.pointerType === 'mouse' && event.button !== 0) return;
        event.preventDefault();

        dragData.value = { taskId: task.id, fromZone: zoneKey };

        document.addEventListener('pointermove', onPointerMove);
        document.addEventListener('pointerup', onPointerUp);
    }

    onUnmounted(() => {
        document.removeEventListener('pointermove', onPointerMove);
        document.removeEventListener('pointerup', onPointerUp);
    });

    return {
        dragOverZone,
        dragData,
        lastDrop,
        onTaskPointerDown,
    };
}
