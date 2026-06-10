<template>
    <div class="flex-1 flex flex-col h-full bg-[var(--bg-app)] overflow-hidden">
        <!-- Header -->
        <div class="px-4 py-4 flex items-center justify-between border-b border-[var(--color-border)] shrink-0 bg-[var(--bg-app)]">
            <button 
                class="w-10 h-10 rounded-xl bg-[var(--bg-secondary)] flex items-center justify-center hover:opacity-80 transition-all border border-[var(--color-border)] shadow-none"
                @click="$emit('close')"
            >
                <svg
                    class="w-5 h-5 text-[var(--color-text)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                ><path
                    stroke-linecap="round"
                    stroke-linejoin="round"
                    stroke-width="2.5"
                    d="M15 19l-7-7 7-7"
                /></svg>
            </button>
            
            <h2 class="text-sm font-black text-[var(--color-text)] uppercase tracking-widest">
                {{ $t('edit_category.title') }}
            </h2>

            <button 
                class="px-5 py-2.5 bg-[var(--btn-primary-bg)] text-[var(--btn-primary-text)] rounded-xl font-bold text-xs shadow-sm hover:opacity-90 active:scale-95 transition-all border border-[var(--color-border)] uppercase tracking-widest"
                @click="handleSave"
            >
                {{ $t('common.save') }}
            </button>
        </div>

        <div class="flex-1 overflow-y-auto p-6 space-y-6 custom-scrollbar">
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
                        <div class="relative flex items-center mt-1">
                            <input
                                v-model="editData.hide_until"
                                type="time"
                                class="w-full p-2 border border-[var(--color-border)] rounded-xl text-sm focus:ring-2 focus:ring-[var(--color-border)] outline-none transition-all bg-[var(--bg-secondary)] text-[var(--color-text)] pr-10"
                            >
                            <button
                                v-if="editData.hide_until"
                                type="button"
                                class="absolute right-2 text-xl text-[var(--color-secondary)] hover:text-red-500 transition-colors p-1 leading-none"
                                @click="editData.hide_until = ''"
                            >
                                &times;
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div v-if="!isNew" class="pt-6">
                <button 
                    class="w-full py-4 bg-[var(--bg-secondary)] text-red-500 rounded-2xl flex items-center justify-center gap-3 hover:bg-red-500/10 transition-colors border border-[var(--color-border)] font-bold text-xs uppercase tracking-widest shadow-none" 
                    @click="$emit('delete', slug)"
                >
                    <svg
                        class="w-5 h-5"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    ><path
                        stroke-linecap="round"
                        stroke-linejoin="round"
                        stroke-width="2"
                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                    /></svg>
                    {{ $t('common.delete') || 'Delete' }}
                </button>
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
