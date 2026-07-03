import { describe, it, expect, beforeEach } from 'vitest';
import { registerPlugin, getPlugin, listPlugins } from '../../../resources/js/plugins/vizPluginRegistry.js';

describe('VizPlugin Registry', () => {
    beforeEach(() => {
        // Clear side effects between tests — the registry is a module-level Map
        // We can only test that registration and retrieval work
    });

    it('registers and retrieves a plugin', () => {
        const plugin = {
            name: 'test-viz',
            label: { en: 'Test Viz' },
            loader: async () => ({ template: '<div>Test</div>' }),
            version: '1.0.0',
            source: { type: 'builtin', name: 'test-viz' },
        };
        registerPlugin(plugin);
        expect(getPlugin('test-viz')).toBeDefined();
        expect(getPlugin('test-viz').label.en).toBe('Test Viz');
    });

    it('lists all registered plugins', async () => {
        // Import plugins to trigger registration
        await import('../../../resources/js/plugins/BubblePlugin.js');
        await import('../../../resources/js/plugins/TreemapPlugin.js');
        const plugins = listPlugins();
        expect(plugins.length).toBeGreaterThanOrEqual(2);
        const names = plugins.map(p => p.name);
        expect(names).toContain('bubbles');
        expect(names).toContain('treemap');
    });

    it('getPlugin returns undefined for unknown plugin', () => {
        expect(getPlugin('nonexistent')).toBeUndefined();
    });

    it('each builtin plugin has required fields', () => {
        const plugins = listPlugins();
        for (const p of plugins) {
            expect(p.name).toBeTruthy();
            expect(p.label).toBeTruthy();
            expect(p.loader).toBeTypeOf('function');
            expect(p.version).toBeTruthy();
            expect(p.source).toBeTruthy();
            expect(p.source.type).toBe('builtin');
        }
    });
});
