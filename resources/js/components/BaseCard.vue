<template>
    <div :class="cardClasses">
        <div v-if="$slots.header" :class="headerClasses">
            <slot name="header" />
        </div>
        <div :class="bodyClasses">
            <slot />
        </div>
        <div v-if="$slots.footer" :class="footerClasses">
            <slot name="footer" />
        </div>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    padding: { type: String, default: 'md', validator: v => ['none', 'sm', 'md', 'lg'].includes(v) },
    radius: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
});

const PADDING_MAP = { none: '', sm: 'p-3', md: 'p-5', lg: 'p-6' };
const RADIUS_MAP = { sm: 'rounded-sm', md: 'rounded-md', lg: 'rounded-lg' };

const cardClasses = computed(() => {
    const pad = PADDING_MAP[props.padding];
    const rad = RADIUS_MAP[props.radius];
    return `${pad} ${rad} bg-[var(--bg-card)] border border-[var(--color-border)] shadow-sm`;
});

const headerClasses = computed(() => 'pb-3 border-b border-[var(--color-border)] mb-4');
const bodyClasses = computed(() => props.padding === 'none' ? '' : '');
const footerClasses = computed(() => 'pt-3 border-t border-[var(--color-border)] mt-4');
</script>
