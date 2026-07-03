<template>
    <span :class="badgeClasses">
        <slot />
    </span>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    variant: { type: String, default: 'default', validator: v => ['default', 'success', 'warning', 'danger', 'info'].includes(v) },
    size: { type: String, default: 'sm', validator: v => ['sm', 'md'].includes(v) },
});

const VARIANT_CLASSES = {
    default: 'bg-[var(--bg-secondary)] text-[var(--color-secondary)] border border-[var(--color-border)]',
    success: 'bg-[var(--color-success)]/10 text-[var(--color-success)]',
    warning: 'bg-[var(--color-warning)]/10 text-[var(--color-warning)]',
    danger: 'bg-[var(--color-danger)]/10 text-[var(--color-danger)]',
    info: 'bg-[var(--color-info)]/10 text-[var(--color-info)]',
};

const SIZE_CLASSES = {
    sm: 'px-2 py-px text-[var(--text-caption)]',
    md: 'px-2.5 py-0.5 text-[var(--text-label)]',
};

const badgeClasses = computed(() =>
    `inline-block align-middle font-bold uppercase tracking-wider rounded-md ${VARIANT_CLASSES[props.variant]} ${SIZE_CLASSES[props.size]}`
);
</script>
