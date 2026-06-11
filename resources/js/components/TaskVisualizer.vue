<template>
    <component 
        :is="currentVisualizer" 
        :tasks="resolvedTasks" 
        :mode="mode"
        @edit="handleEdit" 
    />
</template>

<script setup>
import { defineAsyncComponent, computed } from 'vue';
import { useBalanceStore } from '../stores/balance';

const props = defineProps({
    tasks: { type: Array, default: null },
    mode: { type: String, default: 'combined' }
});

const emit = defineEmits(['edit']);
const store = useBalanceStore();

const resolvedTasks = computed(() => props.tasks || store.bubbleTasks);

const visualizers = {
    bubbles: defineAsyncComponent(() => import('./BubbleChart.vue')),
    treemap: defineAsyncComponent(() => import('./TreemapChart.vue')),
};

const currentVisualizer = computed(() => visualizers[store.visualStyle] || visualizers.bubbles);

const handleEdit = (task) => {
    emit('edit', task);
};
</script>