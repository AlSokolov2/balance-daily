<template>
    <div class="w-full">
        <textarea
            :value="modelValue"
            :placeholder="placeholder"
            :disabled="disabled"
            :rows="rows"
            :class="textareaClasses"
            @input="$emit('update:modelValue', $event.target.value)"
            @focus="$emit('focus', $event)"
            @blur="$emit('blur', $event)"
        />
        <p v-if="error" class="mt-1 text-[var(--text-caption)] text-[var(--color-danger)]">
            {{ error }}
        </p>
    </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
    modelValue: { type: String, default: '' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    error: { type: String, default: '' },
    rows: { type: Number, default: 3 },
});

defineEmits(['update:modelValue', 'focus', 'blur']);

const textareaClasses = computed(() => {
    const base = 'w-full px-3 py-2.5 bg-[var(--bg-secondary)] border border-[var(--color-border)] rounded-md text-[var(--text-body)] text-[var(--color-text)] outline-none transition-all focus:ring-2 focus:ring-[var(--color-border)] placeholder:text-[var(--color-secondary)]/50 resize-none';
    if (props.disabled) return `${base} opacity-50 cursor-not-allowed`;
    if (props.error) return `${base} border-[var(--color-danger)] focus:ring-[var(--color-danger)]/30`;
    return base;
});
</script>
