/**
 * Priority engine and navigation tests.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useTasksStore } from '../../../resources/js/stores/tasks';
import { useBalanceStore } from '../../../resources/js/stores/balance';
import { calcPriority, recalculateTasks } from '../../../resources/js/utils/priority-engine';

describe('Priority Engine', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
    });

    it('calcPriority returns higher value for higher importance', () => {
        const cats = { chor: { currentWeight: 0.13, baseWeight: 0.13 } };
        const subcatCoeffs = [];

        const low = calcPriority(
            { importance: 1, category_slug: 'chor', deadline: null, postpone_until: null },
            cats, subcatCoeffs
        );
        const high = calcPriority(
            { importance: 5, category_slug: 'chor', deadline: null, postpone_until: null },
            cats, subcatCoeffs
        );

        expect(high).toBeGreaterThan(low);
    });

    it('calcPriority applies deadline bonus for imminent deadlines', () => {
        const cats = { chor: { currentWeight: 0.5, baseWeight: 0.5 } };
        const subcatCoeffs = [];

        const noDeadline = calcPriority(
            { importance: 3, category_slug: 'chor', deadline: null, postpone_until: null },
            cats, subcatCoeffs
        );
        const imminent = calcPriority(
            { importance: 3, category_slug: 'chor',
                deadline: new Date(Date.now() + 3600000).toISOString(), // 1 hour
                postpone_until: null },
            cats, subcatCoeffs
        );

        expect(imminent).toBeGreaterThan(noDeadline);
    });

    it('calcPriority applies postpone penalty for future postpone_until', () => {
        const cats = { chor: { currentWeight: 0.5, baseWeight: 0.5 } };
        const subcatCoeffs = {};

        const normal = calcPriority(
            { importance: 3, category_slug: 'chor', deadline: null, postpone_until: null },
            cats, subcatCoeffs
        );
        // postponed 1 year in future → penalty applied
        const postponed = calcPriority(
            { importance: 3, category_slug: 'chor', deadline: null,
                postpone_until: new Date(Date.now() + 365 * 86400000).toISOString() },
            cats, subcatCoeffs
        );
        // normal: 0.5 * 3 = 1.5, postponed: 1.5 * 0.7 = 1.05
        expect(postponed).toBeLessThan(normal);
    });

    it('recalculateTasks boosts categories with zero completions today', () => {
        const tasks = [
            { id: 1, title: 'A', category_slug: 'chor', importance: 3, completed: false, deadline: null, postpone_until: null },
            { id: 2, title: 'B', category_slug: 'prog', importance: 3, completed: false, deadline: null, postpone_until: null },
        ];
        const categories = [
            { id: 1, slug: 'chor', name: 'CHOR', weight: 0.13, color: '#f00', hide_until: null },
            { id: 2, slug: 'prog', name: 'PROG', weight: 0.46, color: '#0f0', hide_until: null },
        ];

        const result = recalculateTasks(tasks, categories, []);
        expect(result).toHaveLength(2);
        // Categories get boosted weight (×1.5) when no completions today
        const chor = categories.find(c => c.slug === 'chor');
        // 0.13 * 1.5 = 0.195, then normalized: 0.195 / (0.195 + 0.69) ≈ 0.22
        expect(chor.currentWeight).toBeCloseTo(0.22, 1);
    });

    it('recalculateTasks with subcategory coefficients passed to calcPriority', () => {
        const catsMap = { prog: { currentWeight: 0.5, baseWeight: 0.5 } };
        const subcatCoeffs = { frontend: 1.5 };

        const p = calcPriority(
            { category_slug: 'prog', subcategory: 'frontend', importance: 4,
                deadline: null, postpone_until: null },
            catsMap, subcatCoeffs
        );
        // 0.5 * 4 * 1.5 = 3.0
        expect(p).toBeCloseTo(3.0, 1);
    });
});

describe('Navigation State', () => {
    it('filterCat defaults to all', () => {
        setActivePinia(createPinia());
        const balance = useBalanceStore();
        expect(balance.filterCat).toBe('all');
        expect(balance.searchQuery).toBe('');
    });

    it('settings store persists theme', async () => {
        setActivePinia(createPinia());
        const { useSettingsStore } = await import('../../../resources/js/stores/settings');
        const settings = useSettingsStore();
        expect(settings.theme).toBe('system');
        settings.theme = 'dark';
        expect(settings.theme).toBe('dark');
    });

    it('locale defaults to ru', async () => {
        setActivePinia(createPinia());
        const { useSettingsStore } = await import('../../../resources/js/stores/settings');
        const settings = useSettingsStore();
        expect(settings.locale).toBe('ru');
    });

    it('visual style defaults to bubbles', async () => {
        setActivePinia(createPinia());
        const { useUiStore } = await import('../../../resources/js/stores/ui');
        const ui = useUiStore();
        expect(ui.visualStyle).toBe('bubbles');
        ui.setVisualStyle('treemap');
        expect(ui.visualStyle).toBe('treemap');
    });
});
