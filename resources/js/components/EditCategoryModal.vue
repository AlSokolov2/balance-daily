<template>
    <div class="fixed inset-0 z-[300] flex items-center justify-center bg-black/50 p-4" @click.self="$emit('close')">
        <div class="bg-[var(--bg-card)] rounded-2xl p-4 sm:p-5 w-full max-w-sm shadow-2xl relative max-h-[90vh] overflow-y-auto overflow-x-hidden border border-[var(--color-border)]">
            <div class="flex justify-between items-center mb-4">
                <h2 class="text-lg font-bold text-[var(--color-text)]">
                    {{ $t('edit_category.title') }}
                </h2>
                <span class="cursor-pointer text-2xl text-[var(--color-secondary)] hover:text-[var(--color-text)] transition-colors" @click="$emit('close')">&times;</span>
            </div>

            <div class="space-y-4">
                <div class="min-w-0">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_category.name') }}</label>
                    <input v-model="editData.name" type="text" class="w-full p-2.5 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                </div>

                <div class="min-w-0">
                    <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 flex justify-between tracking-wider">
                        <span>{{ $t('edit_category.weight') }}</span>
                        <span class="text-[var(--color-text)] font-black">{{ editData.weight }}%</span>
                    </label>
                    <div class="flex items-center gap-3 mt-1">
                        <input
                            v-model.number="editData.weight"
                            type="range"
                            min="1"
                            max="99"
                            class="flex-1 accent-[var(--color-text)]"
                        >
                    </div>
                </div>

                <div class="flex flex-col sm:grid sm:grid-cols-2 gap-3">
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_category.color') }}</label>
                        <div class="flex items-center gap-2 mt-1">
                            <input v-model="editData.color" type="color" class="w-10 h-10 p-0.5 border border-[var(--color-border)] rounded-xl cursor-pointer bg-[var(--bg-secondary)]">
                            <span class="text-xs text-[var(--color-secondary)] font-mono">{{ editData.color }}</span>
                        </div>
                    </div>
                    <div class="min-w-0">
                        <label class="text-[10px] text-[var(--color-secondary)] uppercase font-bold px-1 tracking-wider">{{ $t('edit_category.hide_until') }}</label>
                        <input v-model="editData.hide_until" type="time" class="w-full mt-1 p-2 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)]">
                    </div>
                </div>

                <div class="pt-4 flex gap-2 border-t border-[var(--color-border)]">
                    <button v-if="!isNew" class="w-12 py-3 bg-[var(--bg-secondary)] text-red-500 rounded-xl flex items-center justify-center hover:opacity-80 transition-colors border border-[var(--color-border)]" @click="$emit('delete', slug)">
                        <svg
                            class="w-5 h-5"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            xmlns="http://www.w3.org/2000/svg"
                        ><path
                            stroke-linecap="round"
                            stroke-linejoin="round"
                            stroke-width="2"
                            d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        /></svg>
                    </button>
                    <button class="flex-1 py-3 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] border border-[var(--color-border)] rounded-xl font-bold text-sm shadow-sm active:scale-[0.98] transition-all" @click="handleSave">
                        {{ $t('edit_category.done') }}
                    </button>
                </div>
            </div>
        </div>
    </div>
</template>

<script setup>
import { reactive, watch } from 'vue';

const props = defineProps({
    category: {
        type: Object,
        required: true
    },
    slug: {
        type: String,
        required: true
    },
    isNew: {
        type: Boolean,
        default: false
    }
});

const emit = defineEmits(['close', 'save', 'delete', 'weight-changed']);

const editData = reactive({ ...props.category });

// Notify parent immediately when weight changes so it can balance others
watch(() => editData.weight, (newWeight) => {
    emit('weight-changed', props.slug, newWeight);
});

// Allow parent to update local state if syncWeights changes it
watch(() => props.category.weight, (newWeight) => {
    editData.weight = newWeight;
});

const handleSave = () => {
    emit('save', props.slug, { ...editData });
};
</script>
