/**
 * Bubble chart visualization plugin.
 */
import { registerPlugin } from './vizPluginRegistry.js';

registerPlugin({
    name: 'bubbles',
    label: { ru: 'Пузыри', en: 'Bubbles' },
    loader: () => import('../components/BubbleChart.vue'),
    version: '1.0.0',
    getter: (store) => store.bubbleTasks,
    defaultSettings: { mode: 'combined' },
    source: { type: 'builtin', name: 'bubbles' },
});
