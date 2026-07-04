/**
 * UI module — visualization style, treemap settings, view state.
 * Plain functions that operate on a store instance.
 *
 * @see #129 — Split monolith store
 */

/**
 * Set active visualization plugin.
 * @param {Object} store — balance store instance
 * @param {string} s — plugin name ('bubbles' | 'treemap')
 */
export function setVisualStyle(store, s) {
    store.visualStyle = s;
    localStorage.setItem('visual_style', s);
}

/**
 * Set treemap zoom scale.
 * @param {Object} store — balance store instance
 * @param {number|string} s — scale value
 */
export function setTreemapScale(store, s) {
    store.treemapScale = parseFloat(s);
    localStorage.setItem('treemap_scale', s);
}

/**
 * Set treemap layout mode.
 * @param {Object} store — balance store instance
 * @param {string} m — 'nested' | 'flat' | 'airy'
 */
export function setTreemapMode(store, m) {
    store.treemapMode = m;
    localStorage.setItem('treemap_mode', m);
}
