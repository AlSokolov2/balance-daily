<template>
    <div v-if="count > 1" class="flex flex-col gap-2" role="status" aria-label="Loading">
        <div
            v-for="n in count"
            :key="n"
            :class="skeletonClasses"
            :style="skeletonStyle"
        />
    </div>
    <div
        v-else
        :class="skeletonClasses"
        :style="skeletonStyle"
        role="status"
        aria-label="Loading"
    />
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: { type: String, default: 'text', validator: v => ['text', 'circle', 'rect', 'card'].includes(v) },
    width: { type: String, default: null },
    height: { type: String, default: null },
    count: { type: Number, default: 1 },
    rounded: { type: String, default: null },
});

const DEFAULT_SIZES = {
    text: { width: '100%', height: '16px', rounded: 'sm' },
    circle: { width: '40px', height: '40px', rounded: 'full' },
    rect: { width: '100%', height: '80px', rounded: 'md' },
    card: { width: '100%', height: '160px', rounded: 'md' },
};

const skeletonStyle = computed(() => {
    const def = DEFAULT_SIZES[props.variant];
    return {
        width: props.width ?? def.width,
        height: props.height ?? def.height,
    };
});

const skeletonClasses = computed(() => {
    const def = DEFAULT_SIZES[props.variant];
    const radius = props.rounded ?? def.rounded;
    const radiusClass = radius === 'full' ? 'rounded-full' : `rounded-${radius}`;
    return `bg-[var(--bg-secondary)] animate-pulse ${radiusClass}`;
});
</script>
