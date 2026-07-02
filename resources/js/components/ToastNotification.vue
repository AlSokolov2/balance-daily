<template>
    <Transition name="toast">
        <div
            v-if="visible"
            class="fixed bottom-24 left-1/2 -translate-x-1/2 z-[150] cursor-default"
        >
            <div class="bg-[var(--bg-card)]/80 backdrop-blur-xl border border-[var(--color-border)] rounded-full px-4 py-2 shadow-2xl flex items-center gap-3">
                <div class="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center shrink-0 shadow-sm">
                    <svg
                        class="w-3.5 h-3.5 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="3"
                            d="M5 13l4 4L19 7"
                        />
                    </svg>
                </div>
                <span class="text-xs font-bold text-[var(--color-text)] pr-1">{{ message }}</span>
            </div>
        </div>
    </Transition>
</template>

<script setup>
import { useToast } from '../composables/useToast';

const { message, visible } = useToast();
</script>

<style scoped>
.toast-enter-active {
    transition: all 0.3s ease-out;
}
.toast-leave-active {
    transition: all 0.25s ease-in;
}
.toast-enter-from {
    transform: translate(-50%, 100%);
    opacity: 0;
}
.toast-leave-to {
    transform: translate(-50%, 100%);
    opacity: 0;
}
</style>
