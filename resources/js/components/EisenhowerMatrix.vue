<template>
    <div class="flex-1 flex flex-col min-h-0 min-w-0 p-4 gap-4">
        <!-- Header: axis labels -->
        <div class="grid grid-cols-[auto_1fr] gap-2 items-stretch flex-1 min-h-0">
            <!-- Y-axis label (left) -->
            <div class="flex items-center justify-center pr-2">
                <span class="text-[9px] font-black uppercase tracking-widest text-[var(--color-secondary)] [writing-mode:vertical-lr] rotate-180">
                    {{ $t('edit_task.importance') }}
                </span>
            </div>

            <!-- 2x2 matrix -->
            <div class="flex-1 flex flex-col min-h-0">
                <!-- Top row: Q1 + Q2 (high importance) -->
                <div class="flex-1 grid grid-cols-2 gap-1 min-h-0">
                    <!-- Q1: Urgent + Important -->
                    <QuadrantCard
                        :tasks="quadrants.q1"
                        :label="$t('eisenhower.q1')"
                        :color="'var(--color-danger, #ef4444)'"
                        variant="solid"
                        @edit="$emit('edit', $event)"
                    />
                    <!-- Q2: Not Urgent + Important -->
                    <QuadrantCard
                        :tasks="quadrants.q2"
                        :label="$t('eisenhower.q2')"
                        :color="'var(--color-primary, #3b82f6)'"
                        variant="soft"
                        @edit="$emit('edit', $event)"
                    />
                </div>

                <!-- Axis divider -->
                <div class="flex items-center justify-center gap-2 py-0.5">
                    <span class="text-[8px] font-black uppercase tracking-widest text-[var(--color-secondary)]">
                        {{ $t('eisenhower.not_urgent') }}
                    </span>
                    <div class="flex-1 h-px bg-[var(--color-border)]" />
                    <span class="text-[9px] font-black uppercase tracking-[0.2em] text-[var(--color-text)]">
                        {{ $t('eisenhower.urgency') }}
                    </span>
                    <div class="flex-1 h-px bg-[var(--color-border)]" />
                    <span class="text-[8px] font-black uppercase tracking-widest text-[var(--color-secondary)]">
                        {{ $t('eisenhower.urgent') }}
                    </span>
                </div>

                <!-- Bottom row: Q4 + Q3 (low importance) -->
                <div class="flex-1 grid grid-cols-2 gap-1 min-h-0">
                    <!-- Q4: Not Urgent + Not Important -->
                    <QuadrantCard
                        :tasks="quadrants.q4"
                        :label="$t('eisenhower.q4')"
                        :color="'var(--color-secondary)'"
                        variant="ghost"
                        @edit="$emit('edit', $event)"
                    />
                    <!-- Q3: Urgent + Not Important -->
                    <QuadrantCard
                        :tasks="quadrants.q3"
                        :label="$t('eisenhower.q3')"
                        :color="'var(--color-warning, #f59e0b)'"
                        variant="muted"
                        @edit="$emit('edit', $event)"
                    />
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';
import QuadrantCard from './QuadrantCard.vue';

const props = defineProps({
    tasks: { type: Array, required: true },
    mode: { type: String, default: 'combined' },
});

defineEmits(['edit']);

const HIGH_IMPORTANCE_THRESHOLD = 2.0;

const quadrants = computed(() => {
    const q1 = []; // urgent + important
    const q2 = []; // not urgent + important
    const q3 = []; // urgent + not important
    const q4 = []; // not urgent + not important

    for (const task of props.tasks) {
        const isUrgent = task.urgency === 'urgent';
        const isImportant = parseFloat(task.importance || 2) >= HIGH_IMPORTANCE_THRESHOLD;

        if (isUrgent && isImportant) q1.push(task);
        else if (!isUrgent && isImportant) q2.push(task);
        else if (isUrgent && !isImportant) q3.push(task);
        else q4.push(task);
    }

    return { q1, q2, q3, q4 };
});
</script>
