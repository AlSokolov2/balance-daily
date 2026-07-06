/**
 * Touch-friendly drag-and-drop via Pointer Events.
 *
 * Replaces HTML5 Drag API (which doesn't work on touch devices) with
 * Pointer Events that unify mouse + touch.
 *
 * Usage in a card component:
 *   const { onTaskPointerDown, dropZoneRef } = useDragTask();
 *   // Task item:   @pointerdown.prevent="onTaskPointerDown(task, quadrant, $event)"
 *   // Drop zone:   :ref="dropZoneRef"  data-drop-zone="q1"
 *   // Listen:      watch(dropResult, (r) => { if (r) emitMove(r); })
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

/**
 * Composable for touch-friendly drag-and-drop.
 * Use in card components that act as both drag source and drop target.
 */
export function useDragTask() {
    function onTaskPointerDown(task, zoneKey, event) {
        // Only respond to primary pointer (finger/stylus, not right-click)
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

    /** Attach this to each drop-zone container via :ref */
    function dropZoneRef(el) {
        // Data attribute is set in template: data-drop-zone="q1"
        // This ref just ensures the element is registered in DOM
        void el;
    }

    return {
        /** Reactive — which zone is currently hovered */
        dragOverZone,
        /** Reactive — currently dragged task info (null if not dragging) */
        dragData,
        /** Latest completed drop result. Watch this to react to drops. */
        lastDrop,
        /** Call on task item @pointerdown.prevent */
        onTaskPointerDown,
        /** Attach to drop zone container :ref */
        dropZoneRef,
    };
}
