<template>
    <div class="flex-1 flex flex-col min-h-0 min-w-0">
        <!-- Plugin error fallback -->
        <div
            v-if="error"
            class="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center"
        >
            <AppIcon name="danger" :size="32" class="text-[var(--color-secondary)]" />
            <p class="text-sm font-bold text-[var(--color-secondary)]">
                {{ $t('app.viz_load_error') }}
            </p>
            <BaseButton variant="ghost" size="sm" @click="retry">
                {{ $t('common.retry') }}
            </BaseButton>
        </div>

        <!-- Active visualization plugin -->
        <Suspense v-else>
            <component
                :is="currentComponent"
                :tasks="resolvedTasks"
                :mode="pluginMode"
                @edit="handleEdit"
            />
            <template #fallback>
                <div class="flex-1 flex items-center justify-center">
                    <AppSkeleton variant="rect" height="200px" width="100%" />
                </div>
            </template>
        </Suspense>
    </div>
</template>

<script setup>
import { defineAsyncComponent, computed, ref, onErrorCaptured, watch } from 'vue';
import { useBalanceStore } from '../stores/balance';
import { getPlugin } from '../plugins/vizPluginRegistry.js';
import '../plugins/BubblePlugin.js';
import '../plugins/TreemapPlugin.js';
import AppIcon from './AppIcon.vue';
import AppSkeleton from './AppSkeleton.vue';
import BaseButton from './BaseButton.vue';

const props = defineProps({
    tasks: { type: Array, default: null },
    mode: { type: String, default: 'combined' },
});

const emit = defineEmits(['edit']);
const store = useBalanceStore();

const error = ref(null);
const retryCount = ref(0);

const plugin = computed(() => getPlugin(store.visualStyle));

const resolvedTasks = computed(() => {
    if (props.tasks) return props.tasks;
    const p = plugin.value;
    return p?.getter ? p.getter(store) : store.bubbleTasks;
});

const pluginMode = computed(() => {
    // Explicit prop (e.g. mode="single" from mobile) overrides plugin default
    if (props.mode !== 'combined') return props.mode;
    const p = plugin.value;
    return p?.defaultSettings?.mode || 'combined';
});

const currentComponent = computed(() => {
    const p = plugin.value;
    if (!p) return null;
    // Re-fetch on retry by adding retryCount to the key
    return defineAsyncComponent(p.loader);
});

const retry = () => {
    error.value = null;
    retryCount.value++;
};

// Catch errors from the async component
onErrorCaptured((err) => {
    console.warn('VizPlugin error:', err);
    error.value = err;
    return false; // prevent propagation
});

const handleEdit = (task) => {
    emit('edit', task);
};
</script>
