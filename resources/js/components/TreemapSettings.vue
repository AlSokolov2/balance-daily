<template>
    <div class="space-y-6 pt-4 border-t border-[var(--color-border)]">
        <div>
            <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black px-1 tracking-widest block mb-3">
                {{ $t('settings.general.treemap_mode') }}
            </label>
            <div class="grid grid-cols-3 gap-2 bg-[var(--bg-secondary)] p-1 rounded-2xl border border-[var(--color-border)]">
                <button
                    v-for="mode in ['flat', 'nested', 'airy']"
                    :key="mode"
                    :class="['py-3 rounded-xl text-[10px] font-bold transition-all',
                             uiStore.treemapMode === mode
                                 ? 'bg-[var(--bg-card)] text-[var(--color-text)] shadow-sm'
                                 : 'bg-transparent text-[var(--color-secondary)]']"
                    @click="uiStore.setTreemapMode(mode)"
                >
                    {{ $t(`settings.general.treemap_modes.${mode}`) }}
                </button>
            </div>
        </div>

        <div>
            <div class="flex justify-between items-center mb-3 px-1">
                <label class="text-[10px] text-[var(--color-secondary)] uppercase font-black tracking-widest">
                    {{ $t('settings.general.treemap_scale') }}
                </label>
                <span class="text-[10px] font-bold text-[var(--color-primary)]">
                    {{ uiStore.treemapScale.toFixed(1) }}x
                </span>
            </div>
            <input
                :value="uiStore.treemapScale"
                type="range"
                min="1.0"
                max="3.0"
                step="0.1"
                class="w-full accent-[var(--color-primary)]"
                @input="uiStore.setTreemapScale($event.target.value)"
            >
            <p class="text-[9px] text-[var(--color-secondary)] mt-2 px-1 leading-relaxed">
                {{ $t('settings.general.treemap_scale_desc') }}
            </p>
        </div>
    </div>
</template>

<script setup>
import { useUiStore } from '../stores/ui.js';

const uiStore = useUiStore();
</script>
