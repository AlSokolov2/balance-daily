/**
 * Unit tests for UI Pinia store.
 */
import { describe, it, expect, beforeEach } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useUiStore } from '../../../resources/js/stores/ui';

describe('UI Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    it('has correct default state', () => {
        const ui = useUiStore();
        expect(ui.visualStyle).toBe('bubbles');
        expect(ui.treemapScale).toBe(1.2);
        expect(ui.treemapMode).toBe('nested');
    });

    it('reads values from localStorage', () => {
        localStorage.setItem('visual_style', 'treemap');
        localStorage.setItem('treemap_scale', '2.5');
        localStorage.setItem('treemap_mode', 'airy');
        setActivePinia(createPinia());
        const ui = useUiStore();

        expect(ui.visualStyle).toBe('treemap');
        expect(ui.treemapScale).toBe(2.5);
        expect(ui.treemapMode).toBe('airy');
    });

    it('setVisualStyle updates state and localStorage', () => {
        const ui = useUiStore();
        ui.setVisualStyle('treemap');
        expect(ui.visualStyle).toBe('treemap');
        expect(localStorage.getItem('visual_style')).toBe('treemap');
    });

    it('setTreemapScale updates state and localStorage', () => {
        const ui = useUiStore();
        ui.setTreemapScale(2.5);
        expect(ui.treemapScale).toBe(2.5);
        expect(localStorage.getItem('treemap_scale')).toBe('2.5');
    });

    it('setTreemapScale parses string input', () => {
        const ui = useUiStore();
        ui.setTreemapScale('1.8');
        expect(ui.treemapScale).toBe(1.8);
        expect(localStorage.getItem('treemap_scale')).toBe('1.8');
    });

    it('setTreemapMode updates state and localStorage', () => {
        const ui = useUiStore();
        ui.setTreemapMode('airy');
        expect(ui.treemapMode).toBe('airy');
        expect(localStorage.getItem('treemap_mode')).toBe('airy');
    });

    it('setTreemapMode supports all modes', () => {
        const ui = useUiStore();
        const modes = ['nested', 'flat', 'airy'];
        modes.forEach(mode => {
            ui.setTreemapMode(mode);
            expect(ui.treemapMode).toBe(mode);
        });
    });
});
