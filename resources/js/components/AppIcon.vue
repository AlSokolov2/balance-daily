<template>
    <svg
        :width="sizePx"
        :height="sizePx"
        :viewBox="iconData.viewBox"
        :fill="iconData.fill || 'none'"
        :stroke="iconData.fill ? 'none' : 'currentColor'"
        :stroke-width="computedStrokeWidth"
        :stroke-linecap="iconData.strokeLinecap || 'round'"
        :stroke-linejoin="iconData.strokeLinejoin || 'round'"
        :class="className"
        xmlns="http://www.w3.org/2000/svg"
    >
        <component
            :is="'path'"
            v-for="(path, index) in iconData.paths"
            :key="index"
            :d="path.d"
            :stroke-linecap="path.strokeLinecap"
            :stroke-linejoin="path.strokeLinejoin"
            :fill-rule="path.fillRule"
            :clip-rule="path.clipRule"
            :fill="path.fill"
            :stroke="path.stroke"
            :stroke-width="path.strokeWidth"
            :opacity="path.opacity"
        />
    </svg>
</template>

<script setup>
import { computed } from 'vue';
import { icons } from './icons/index.js';

const props = defineProps({
    /** Icon identifier from the registry */
    name: { type: String, required: true },
    /** Predefined sizes: 'sm'=16, 'md'=20, 'lg'=24, or a numeric value */
    size: { type: [String, Number], default: 'md' },
    /** Override the default stroke-width from the icon registry */
    strokeWidth: { type: Number, default: null },
});

const SIZES = { sm: 16, md: 20, lg: 24 };

const iconData = computed(() => {
    const data = icons[props.name];
    if (!data) {
        console.warn(`AppIcon: unknown icon "${props.name}"`);
        return { viewBox: '0 0 24 24', paths: [], defaultStroke: 2 };
    }
    return data;
});

const sizePx = computed(() => {
    if (typeof props.size === 'number') return props.size;
    return SIZES[props.size] ?? SIZES.md;
});

const computedStrokeWidth = computed(() => {
    return props.strokeWidth ?? iconData.value.defaultStroke ?? 2;
});

const className = computed(() => 'shrink-0');
</script>
