<template>
    <div
        :data-drop-zone="quadrant"
        :class="[
            'flex flex-col rounded-2xl border p-3 overflow-hidden min-h-0 transition-all',
            'hover:shadow-sm active:scale-[0.99]',
            isDragOver ? 'ring-2 ring-offset-1 scale-[1.02]' : '',
            colorClasses
        ]"
    >
        <!-- Header with label + count -->
        <div class="flex items-center justify-between shrink-0 mb-1">
            <span
                class="text-[9px] font-black uppercase tracking-widest"
                :style="{ color }"
            >
                {{ label }}
            </span>
            <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                :style="{ backgroundColor: color + '18', color }"
            >
                {{ tasks.length }}
            </span>
        </div>

        <!-- Task list -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-0.5">
            <div
                v-for="task in tasks"
                :key="task.id"
                class="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/10 transition-colors text-[11px] cursor-grab active:cursor-grabbing shrink-0"
                :class="{ 'opacity-50': isDraggingThis(task) }"
                @click.stop="$emit('edit', task)"
                @pointerdown.prevent="onTaskPointerDown(task, quadrant, $event)"
            >
                <div
                    class="w-1.5 h-1.5 rounded-full shrink-0"
                    :style="{ backgroundColor: taskColor(task) }"
                />
                <span class="text-[var(--color-text)] truncate leading-tight">
                    {{ task.title }}
                </span>
            </div>

            <!-- Empty state -->
            <div
                v-if="tasks.length === 0"
                class="flex items-center justify-center h-full text-[10px] text-[var(--color-secondary)] opacity-40"
            >
                —
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed, watch } from 'vue';
import { useDragTask } from '../composables/useDragTask.js';

const props = defineProps({
    tasks: { type: Array, required: true },
    label: { type: String, required: true },
    color: { type: String, default: 'var(--color-secondary)' },
    variant: { type: String, default: 'solid' },
    quadrant: { type: String, required: true },
});

const emit = defineEmits(['edit', 'move-task']);

const { dragOverZone, dragData, lastDrop, onTaskPointerDown } = useDragTask();

const isDragOver = computed(() => dragOverZone.value === props.quadrant);

function isDraggingThis(task) {
    return dragData.value?.taskId === task.id;
}

// Emit move-task when a drop completes on this quadrant
watch(lastDrop, (drop) => {
    if (drop && drop.toZone === props.quadrant) {
        emit('move-task', {
            taskId: drop.taskId,
            fromQuadrant: drop.fromZone,
            toQuadrant: props.quadrant,
        });
    }
});

const colorClasses = computed(() => {
    switch (props.variant) {
    case 'solid':
        return `border-[${props.color}]/30 bg-[${props.color}]/8`;
    case 'soft':
        return `border-[${props.color}]/20 bg-[${props.color}]/5`;
    case 'muted':
        return 'border-[var(--color-border)] bg-[var(--bg-secondary)]/30';
    case 'ghost':
        return 'border-[var(--color-border)]/40 bg-transparent';
    default:
        return 'border-[var(--color-border)] bg-[var(--bg-card)]';
    }
});

function taskColor(task) {
    if (task.category_color) return task.category_color;
    const imp = parseFloat(task.importance || 2);
    if (imp >= 3) return 'var(--color-danger, #ef4444)';
    if (imp >= 2) return 'var(--color-primary, #3b82f6)';
    return 'var(--color-secondary)';
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
