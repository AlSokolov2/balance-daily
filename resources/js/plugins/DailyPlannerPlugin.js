/**
 * Daily Planner visualization plugin.
 *
 * Two-column view: Today (scheduled tasks) vs Unscheduled (backlog).
 * Drag tasks between columns to set/clear scheduled_date.
 * Shows estimated_duration per task and total planned time.
 */
import { registerPlugin } from './vizPluginRegistry.js';

registerPlugin({
    name: 'daily',
    label: { ru: 'Планер', en: 'Planner' },
    loader: () => import('../components/DailyPlanner.vue'),
    version: '1.0.0',
    getter: (store) => store.bubbleTasks,
    defaultSettings: { mode: 'combined' },
    source: { type: 'builtin', name: 'daily' },
});
