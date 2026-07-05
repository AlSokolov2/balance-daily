/**
 * Eisenhower Matrix visualization plugin.
 *
 * Splits tasks into 4 quadrants based on urgency × importance:
 *   Q1: Urgent + Important    → Do First
 *   Q2: Not Urgent + Important → Plan
 *   Q3: Urgent + Not Important → Delegate
 *   Q4: Not Urgent + Not Important → Eliminate
 */
import { registerPlugin } from './vizPluginRegistry.js';

registerPlugin({
    name: 'eisenhower',
    label: { ru: 'Эйзенхауэр', en: 'Eisenhower' },
    loader: () => import('../components/EisenhowerMatrix.vue'),
    version: '1.0.0',
    getter: (store) => store.bubbleTasks,
    defaultSettings: { mode: 'combined' },
    source: { type: 'builtin', name: 'eisenhower' },
});
