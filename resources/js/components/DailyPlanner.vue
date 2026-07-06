<template>
    <div class="flex-1 flex flex-col min-h-0 min-w-0 p-4 gap-4">
        <!-- Header -->
        <div class="flex items-center justify-between shrink-0">
            <h3 class="text-xs font-black uppercase tracking-widest text-[var(--color-primary)]">
                {{ todayLabel }}
            </h3>
            <div class="flex items-center gap-3 text-[10px] text-[var(--color-secondary)]">
                <span>{{ $t('daily.total') }}: {{ totalMin }}m</span>
                <span>{{ todayTasks.length }} {{ $t('daily.tasks_today') }}</span>
            </div>
        </div>

        <!-- Two columns: Today | Backlog -->
        <div class="flex-1 grid grid-cols-2 gap-3 min-h-0">
            <!-- Today column -->
            <ColumnCard
                :title="$t('daily.today')"
                :tasks="todayTasks"
                :color="'var(--color-primary)'"
                :empty-text="$t('daily.empty_today')"
                column="today"
                @move-task="handleMoveTask"
                @edit="$emit('edit', $event)"
            />

            <!-- Backlog column -->
            <ColumnCard
                :title="$t('daily.unscheduled')"
                :tasks="unscheduledTasks"
                :color="'var(--color-secondary)'"
                :empty-text="$t('daily.empty_unscheduled')"
                column="unscheduled"
                @move-task="handleMoveTask"
                @edit="$emit('edit', $event)"
            />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import ColumnCard from './ColumnCard.vue';

const props = defineProps({
    tasks: { type: Array, required: true },
    mode: { type: String, default: 'combined' },
});

const emit = defineEmits(['edit', 'update-task']);

const today = new Date().toISOString().substring(0, 10);

const todayTasks = computed(() =>
    props.tasks.filter(t => t.scheduled_date === today)
);

const unscheduledTasks = computed(() =>
    props.tasks.filter(t => !t.scheduled_date || t.scheduled_date !== today)
);

const totalMin = computed(() =>
    todayTasks.value.reduce((sum, t) => sum + (t.estimated_duration || 0), 0)
);

const todayLabel = computed(() => {
    const d = new Date();
    return d.toLocaleDateString('ru-RU', { weekday: 'long', day: 'numeric', month: 'long' });
});

function handleMoveTask({ taskId, toColumn }) {
    const changes = toColumn === 'today'
        ? { scheduled_date: today }
        : { scheduled_date: null };
    emit('update-task', { taskId, changes });
}
</script>
