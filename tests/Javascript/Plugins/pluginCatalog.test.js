import { describe, it, expect } from 'vitest';
import { pluginCatalog, ensurePlugin } from '../../../resources/js/plugins/pluginCatalog.js';
import { getPlugin } from '../../../resources/js/plugins/vizPluginRegistry.js';

describe('pluginCatalog', () => {
    it('has entries with required fields', () => {
        expect(pluginCatalog.length).toBeGreaterThanOrEqual(2);
        for (const entry of pluginCatalog) {
            expect(entry.name).toBeTruthy();
            expect(entry.label).toBeTruthy();
            expect(entry.loader).toBeTypeOf('function');
        }
    });

    it('contains bubbles and treemap entries', () => {
        const names = pluginCatalog.map(e => e.name);
        expect(names).toContain('bubbles');
        expect(names).toContain('treemap');
    });

    it('each entry has ru and en labels', () => {
        for (const entry of pluginCatalog) {
            expect(entry.label.ru).toBeTruthy();
            expect(entry.label.en).toBeTruthy();
        }
    });

    it('ensurePlugin loads and registers a plugin', async () => {
        // Plugin may already be registered from other tests — that's fine
        await ensurePlugin('bubbles');
        const plugin = getPlugin('bubbles');
        expect(plugin).toBeDefined();
        expect(plugin.name).toBe('bubbles');
        expect(plugin.version).toBeTruthy();
        expect(plugin.loader).toBeTypeOf('function');
        expect(plugin.source.type).toBe('builtin');
    });

    it('ensurePlugin is a no-op for already-loaded plugins', async () => {
        await ensurePlugin('bubbles');
        // Calling again should not throw or re-register with a warning
        await ensurePlugin('bubbles');
        expect(getPlugin('bubbles')).toBeDefined();
    });

    it('ensurePlugin does nothing for unknown plugin name', async () => {
        await ensurePlugin('nonexistent-viz');
        // Should not throw, should not register anything
        expect(getPlugin('nonexistent-viz')).toBeUndefined();
    });
});
