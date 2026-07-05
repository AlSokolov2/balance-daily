<template>
    <div
        :class="[
            'flex flex-col rounded-2xl border p-3 overflow-hidden min-h-0 transition-all',
            'hover:shadow-sm active:scale-[0.99]',
            dragOver ? 'ring-2 ring-offset-1 scale-[1.02]' : '',
            colorClasses
        ]"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
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
                draggable="true"
                class="flex items-center gap-2 py-1 px-1.5 rounded-lg hover:bg-white/10 transition-colors text-[11px] cursor-grab active:cursor-grabbing shrink-0"
                :class="{ 'opacity-50': draggingId === task.id }"
                @click.stop="$emit('edit', task)"
                @dragstart="onDragStart($event, task)"
                @dragend="onDragEnd"
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
import { computed, ref } from 'vue';

const props = defineProps({
    tasks: { type: Array, required: true },
    label: { type: String, required: true },
    color: { type: String, default: 'var(--color-secondary)' },
    variant: { type: String, default: 'solid' },
    quadrant: { type: String, required: true },
});

const emit = defineEmits(['edit', 'move-task']);

const dragOver = ref(false);
const draggingId = ref(null);

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

function onDragStart(event, task) {
    draggingId.value = task.id;
    event.dataTransfer.setData('application/json', JSON.stringify({
        taskId: task.id,
        fromQuadrant: props.quadrant,
    }));
    event.dataTransfer.effectAllowed = 'move';
}

function onDragEnd() {
    draggingId.value = null;
    dragOver.value = false;
}

function onDragOver(event) {
    event.dataTransfer.dropEffect = 'move';
    dragOver.value = true;
}

function onDragLeave() {
    dragOver.value = false;
}

function onDrop(event) {
    dragOver.value = false;
    const raw = event.dataTransfer.getData('application/json');
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        // Only emit if dropping on a different quadrant
        if (data.fromQuadrant !== props.quadrant) {
            // Find the task in our tasks list (we don't have it by ID, so emit the ID)
            // The parent will look up the task from its full list
            emit('move-task', {
                taskId: data.taskId,
                fromQuadrant: data.fromQuadrant,
                toQuadrant: props.quadrant,
            });
        }
    } catch { /* ignore invalid data */ }
}

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
