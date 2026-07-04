/**
 * UI store — visualization style, treemap settings.
 * filterCat / searchQuery / bubbleZoom stay in balance.js (mutated directly by components).
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';

export const useUiStore = defineStore('ui', {
    state: () => ({
        visualStyle: localStorage.getItem('visual_style') || 'bubbles',
        treemapScale: parseFloat(localStorage.getItem('treemap_scale')) || 1.2,
        treemapMode: localStorage.getItem('treemap_mode') || 'nested',
    }),

    actions: {
        setVisualStyle(s) {
            this.visualStyle = s;
            localStorage.setItem('visual_style', s);
        },

        setTreemapScale(s) {
            this.treemapScale = parseFloat(s);
            localStorage.setItem('treemap_scale', s);
        },

        setTreemapMode(m) {
            this.treemapMode = m;
            localStorage.setItem('treemap_mode', m);
        },
    },
});
