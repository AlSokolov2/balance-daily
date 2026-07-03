/**
 * VizPlugin contract and registry.
 *
 * A visualization plugin is a Vue component that renders tasks and emits edit
 * events. Plugins register themselves in the registry; TaskVisualizer picks
 * the active one based on store.visualStyle.
 *
 * PluginSource is forward-looking: it supports builtin (bundled) and url
 * (external) plugins, but Phase 1 only implements builtin.
 */

/**
 * @typedef {Object} PluginSource
 * @property {'builtin'|'url'} type
 * @property {string} name  — machine name for 'builtin', URL for 'url'
 * @property {string} [checksum] — SRI checksum for 'url' plugins
 */

/**
 * @typedef {Object} VizPlugin
 * @property {string} name              — machine name: 'bubble' | 'treemap'
 * @property {Object<string,string>} label — { ru: 'Пузыри', en: 'Bubbles' }
 * @property {Function} loader          — () => Promise<Component> for lazy loading
 * @property {string} version           — semver
 * @property {Function} [getter]        — (store) => ComputedRef, defaults to store.bubbleTasks
 * @property {Object} [defaultSettings] — plugin-specific settings (e.g. { mode: 'combined' })
 * @property {PluginSource} source      — where the plugin comes from
 */

/** @type {Map<string, VizPlugin>} */
const registry = new Map();

/**
 * Register a viz plugin.
 * @param {VizPlugin} plugin
 */
export function registerPlugin(plugin) {
    if (registry.has(plugin.name)) {
        console.warn(`VizPlugin "${plugin.name}" is already registered, overwriting.`);
    }
    registry.set(plugin.name, plugin);
}

/**
 * Get a plugin by name.
 * @param {string} name
 * @returns {VizPlugin|undefined}
 */
export function getPlugin(name) {
    return registry.get(name);
}

/**
 * Get all registered plugins.
 * @returns {VizPlugin[]}
 */
export function listPlugins() {
    return Array.from(registry.values());
}

export { registry };
