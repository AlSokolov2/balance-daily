/**
 * Treemap chart visualization plugin.
 */
import { defineAsyncComponent } from 'vue';
import { registerPlugin } from './vizPluginRegistry.js';

registerPlugin({
    name: 'treemap',
    label: { ru: 'Древовидная карта', en: 'Treemap' },
    loader: () => import('../components/TreemapChart.vue'),
    version: '1.0.0',
    getter: (store) => store.bubbleTasks,
    defaultSettings: { mode: 'flat' },
    source: { type: 'builtin', name: 'treemap' },
});
