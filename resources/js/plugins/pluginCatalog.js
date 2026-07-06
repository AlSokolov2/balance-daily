/**
 * Static plugin catalog — metadata only, no code loaded.
 *
 * SettingsView reads this to show available visualizations.
 * Actual plugin code (*Plugin.js + component) is loaded lazily
 * via ensurePlugin() when the user selects a visualization.
 *
 * To add a new builtin plugin:
 * 1. Create XxxPlugin.js in this directory
 * 2. Add an entry to the catalog array below
 *
 * @see vizPluginRegistry.js
 * @see https://github.com/AlSokolov2/balance-daily/issues/132
 */
import { getPlugin } from './vizPluginRegistry.js';

/** @type {Array<{name: string, label: Object<string,string>, loader: Function}>} */
export const pluginCatalog = [
    {
        name: 'bubbles',
        label: { ru: 'Пузыри', en: 'Bubbles' },
        loader: () => import('./BubblePlugin.js'),
    },
    {
        name: 'treemap',
        label: { ru: 'Древовидная карта', en: 'Treemap' },
        loader: () => import('./TreemapPlugin.js'),
    },
    {
        name: 'eisenhower',
        label: { ru: 'Эйзенхауэр', en: 'Eisenhower' },
        loader: () => import('./EisenhowerPlugin.js'),
    },
    {
        name: 'daily',
        label: { ru: 'Планер', en: 'Planner' },
        loader: () => import('./DailyPlannerPlugin.js'),
    },
];

/**
 * Ensure a plugin is loaded and registered.
 * No-op if already registered (e.g. from a previous ensurePlugin call).
 *
 * @param {string} name — plugin machine name
 * @returns {Promise<void>}
 */
export async function ensurePlugin(name) {
    if (getPlugin(name)) return;
    const entry = pluginCatalog.find(p => p.name === name);
    if (entry) {
        await entry.loader();
    }
}
