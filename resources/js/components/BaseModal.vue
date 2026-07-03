<template>
    <Teleport to="body">
        <Transition name="modal">
        <div
            v-if="visible"
            class="fixed inset-0 z-[200] flex items-center justify-center bg-black/50 p-2 sm:p-4"
            @click.self="closeOnBackdrop && $emit('close')"
        >
            <div
                :class="panelClasses"
                :style="{ maxWidth }"
            >
                <!-- Header -->
                <div v-if="$slots.header || title" class="flex items-center justify-between p-5 pb-2">
                    <slot name="header">
                        <h2 class="text-[var(--text-subtitle)] font-black text-[var(--color-text)]">{{ title }}</h2>
                    </slot>
                    <BaseButton variant="secondary" size="sm" icon="close" @click="$emit('close')" />
                </div>

                <!-- Body -->
                <div class="flex-1 overflow-y-auto p-5 pt-0 custom-scrollbar min-h-0">
                    <slot />
                </div>

                <!-- Footer -->
                <div v-if="$slots.footer" class="p-5 pt-0">
                    <slot name="footer" />
                </div>
            </div>
        </div>
        </Transition>
    </Teleport>
</template>

<script setup>
import { computed } from 'vue';
import AppIcon from './AppIcon.vue';
import BaseButton from './BaseButton.vue';

defineProps({
    visible: { type: Boolean, default: false },
    title: { type: String, default: '' },
    maxWidth: { type: String, default: '560px' },
    closeOnBackdrop: { type: Boolean, default: true },
});

defineEmits(['close']);

const panelClasses = computed(() =>
    'bg-[var(--bg-card)] rounded-md w-full h-[80vh] flex flex-col overflow-hidden shadow-lg border border-[var(--color-border)] relative'
);
</script>

<style scoped>
.modal-enter-active,
.modal-leave-active {
    transition: all 0.25s ease;
}
.modal-enter-from {
    opacity: 0;
}
.modal-enter-from > :deep(div) {
    transform: scale(0.95) translateY(10px);
}
.modal-leave-to {
    opacity: 0;
}
.modal-leave-to > :deep(div) {
    transform: scale(0.95) translateY(10px);
}
</style>
