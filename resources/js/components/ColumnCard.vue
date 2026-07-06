<template>
    <div
        :class="[
            'flex flex-col rounded-2xl border p-3 overflow-hidden min-h-0 transition-all',
            dragOver ? 'ring-2 ring-offset-1 scale-[1.02]' : '',
        ]"
        :style="{ borderColor: color + '30', backgroundColor: color + '08' }"
        @dragover.prevent="onDragOver"
        @dragleave="onDragLeave"
        @drop.prevent="onDrop"
    >
        <!-- Header -->
        <div class="flex items-center justify-between shrink-0 mb-2">
            <span
                class="text-[10px] font-black uppercase tracking-widest"
                :style="{ color }"
            >
                {{ title }}
            </span>
            <span
                class="text-[10px] font-bold px-2 py-0.5 rounded-full"
                :style="{ backgroundColor: color + '18', color }"
            >
                {{ tasks.length }}
            </span>
        </div>

        <!-- Task list -->
        <div class="flex-1 overflow-y-auto custom-scrollbar min-h-0 space-y-1">
            <div
                v-for="task in tasks"
                :key="task.id"
                draggable="true"
                class="flex items-center gap-2 py-2 px-2 rounded-lg hover:bg-white/10 transition-colors text-[11px] cursor-grab active:cursor-grabbing shrink-0"
                :class="{ 'opacity-50': draggingId === task.id }"
                @click.stop="$emit('edit', task)"
                @dragstart="onDragStart($event, task)"
                @dragend="onDragEnd"
            >
                <div
                    class="w-2 h-2 rounded-full shrink-0"
                    :style="{ backgroundColor: task.category_color || color }"
                />
                <span class="text-[var(--color-text)] truncate leading-tight flex-1">
                    {{ task.title }}
                </span>
                <span
                    v-if="task.estimated_duration"
                    class="text-[9px] font-bold text-[var(--color-secondary)] shrink-0"
                >
                    {{ task.estimated_duration }}m
                </span>
                <span
                    v-if="task.urgency === 'urgent'"
                    class="text-[9px] font-black text-red-400 shrink-0"
                >!</span>
            </div>

            <!-- Empty state -->
            <div
                v-if="tasks.length === 0"
                class="flex items-center justify-center h-full text-[10px] text-[var(--color-secondary)] opacity-40"
            >
                {{ emptyText }}
            </div>
        </div>
    </div>
</template>

<script setup>
import { ref } from 'vue';

const props = defineProps({
    tasks: { type: Array, required: true },
    title: { type: String, required: true },
    color: { type: String, default: 'var(--color-secondary)' },
    emptyText: { type: String, default: '—' },
    column: { type: String, required: true },
});

const emit = defineEmits(['edit', 'move-task']);

const dragOver = ref(false);
const draggingId = ref(null);

function onDragStart(event, task) {
    draggingId.value = task.id;
    event.dataTransfer.setData('application/json', JSON.stringify({
        taskId: task.id,
        fromColumn: props.column,
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
        if (data.fromColumn !== props.column) {
            emit('move-task', {
                taskId: data.taskId,
                toColumn: props.column,
            });
        }
    } catch { /* ignore invalid data */ }
}
</script>

<style scoped>
.custom-scrollbar::-webkit-scrollbar { width: 3px; }
.custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
.custom-scrollbar::-webkit-scrollbar-thumb { background: var(--color-border); border-radius: 10px; }
</style>
