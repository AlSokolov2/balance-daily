<template>
    <div class="w-full">
        <div :class="wrapperClasses">
            <span v-if="$slots.prepend" class="shrink-0 text-[var(--color-secondary)]">
                <slot name="prepend" />
            </span>
            <input
                :type="type"
                :value="modelValue"
                :placeholder="placeholder"
                :disabled="disabled"
                class="flex-1 bg-transparent border-none outline-none text-[var(--color-text)] placeholder:text-[var(--color-secondary)]/50"
                @input="$emit('update:modelValue', $event.target.value)"
                @focus="$emit('focus', $event)"
                @blur="$emit('blur', $event)"
            >
            <span v-if="$slots.append" class="shrink-0 text-[var(--color-secondary)]">
                <slot name="append" />
            </span>
        </div>
        <p v-if="error" class="mt-1 text-[var(--text-caption)] text-[var(--color-danger)]">
            {{ error }}
        </p>
    </div>
</template>

<script setup>
defineProps({
    modelValue: { type: [String, Number], default: '' },
    type: { type: String, default: 'text' },
    placeholder: { type: String, default: '' },
    disabled: { type: Boolean, default: false },
    error: { type: String, default: '' },
});

defineEmits(['update:modelValue', 'focus', 'blur']);

const wrapperClasses = 'flex items-center gap-2 w-full px-3 py-2.5 bg-[var(--bg-secondary)] border rounded-md text-[var(--text-body)] transition-all outline-none focus-within:ring-2 focus-within:ring-[var(--color-border)] border-[var(--color-border)]';
</script>
