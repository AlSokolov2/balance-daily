<template>
    <button
        :class="buttonClasses"
        :disabled="disabled || loading"
        @click="$emit('click')"
    >
        <span v-if="loading" class="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
        <AppIcon v-else-if="icon && iconPosition === 'left'" :name="icon" :size="iconSize" />
        <span v-if="$slots.default" :class="labelClasses"><slot /></span>
        <AppIcon v-if="icon && iconPosition === 'right' && !loading" :name="icon" :size="iconSize" />
    </button>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';

const props = defineProps({
    variant: { type: String, default: 'primary', validator: v => ['primary', 'secondary', 'danger', 'ghost'].includes(v) },
    size: { type: String, default: 'md', validator: v => ['sm', 'md', 'lg'].includes(v) },
    disabled: { type: Boolean, default: false },
    loading: { type: Boolean, default: false },
    icon: { type: String, default: null },
    iconPosition: { type: String, default: 'left', validator: v => ['left', 'right'].includes(v) },
});

defineEmits(['click']);

const SIZE_MAP = {
    sm: { button: 'px-3 py-1.5 gap-1.5', label: 'text-[var(--text-caption)]', icon: 14 },
    md: { button: 'px-4 py-2.5 gap-2', label: 'text-[var(--text-label)]', icon: 16 },
    lg: { button: 'px-5 py-3 gap-2', label: 'text-[var(--text-body-sm)]', icon: 18 },
};

const VARIANT_CLASSES = {
    primary: 'bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border-[var(--color-border)]',
    secondary: 'bg-[var(--bg-secondary)] text-[var(--color-text)] border-[var(--color-border)]',
    danger: 'bg-transparent text-[var(--color-danger)] border-[var(--color-danger)]/30 hover:bg-[var(--color-danger)]/10',
    ghost: 'bg-transparent text-[var(--color-secondary)] border-transparent hover:text-[var(--color-text)]',
};

const buttonClasses = computed(() => {
    const size = SIZE_MAP[props.size];
    const variant = VARIANT_CLASSES[props.variant];
    const base = `inline-flex items-center justify-center font-bold uppercase tracking-wider rounded-sm border transition-all active:scale-95 ${size.button} ${variant}`;
    if (props.disabled || props.loading) return `${base} opacity-50 cursor-not-allowed`;
    return `${base} hover:opacity-80 cursor-pointer`;
});

const labelClasses = computed(() => {
    const size = SIZE_MAP[props.size];
    return `leading-none ${size.label}`;
});

const iconSize = computed(() => SIZE_MAP[props.size].icon);
</script>
