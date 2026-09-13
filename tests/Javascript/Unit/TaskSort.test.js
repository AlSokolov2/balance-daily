import { describe, it, expect } from 'vitest';
import {
    ARCHIVE_SORTS,
    HIDDEN_SORTS,
    ARCHIVE_SORT_KEYS,
    HIDDEN_SORT_KEYS,
    DEFAULT_ARCHIVE_SORT,
    DEFAULT_HIDDEN_SORT,
    sortArchive,
    sortHidden,
} from '../../../resources/js/utils/task-sort.js';

/**
 * `sortArchive`/`sortHidden` are the public surface; the maps and key lists are exported
 * because the sort bar builds its buttons from them, so they are pinned here too.
 */
describe('task-sort (#155)', () => {
    const at = (hoursAgo) => new Date(Date.now() - hoursAgo * 3_600_000).toISOString();

    it('exposes the sort keys and defaults the sort bar renders', () => {
        expect(ARCHIVE_SORT_KEYS).toEqual(['completed_desc', 'created_desc', 'name_asc']);
        expect(HIDDEN_SORT_KEYS).toEqual(['appears_asc', 'created_desc', 'name_asc']);
        expect(DEFAULT_ARCHIVE_SORT).toBe('completed_desc');
        expect(DEFAULT_HIDDEN_SORT).toBe('appears_asc');
        expect(Object.keys(ARCHIVE_SORTS)).toEqual(ARCHIVE_SORT_KEYS);
        expect(Object.keys(HIDDEN_SORTS)).toEqual(HIDDEN_SORT_KEYS);
    });

    describe('archive', () => {
        const tasks = [
            { id: 1, title: 'Zulu', completed_at: at(1), created_at: at(5) },
            { id: 2, title: 'alpha', completed_at: at(3), created_at: at(4) },
            { id: 3, title: 'Mike', completed_at: at(2), created_at: at(6) },
        ];

        it('defaults to completion date, newest first', () => {
            expect(sortArchive(tasks, DEFAULT_ARCHIVE_SORT).map(t => t.id)).toEqual([1, 3, 2]);
        });

        it('sorts by creation date, newest first', () => {
            expect(sortArchive(tasks, 'created_desc').map(t => t.id)).toEqual([2, 1, 3]);
        });

        it('sorts by name, case-insensitively', () => {
            expect(sortArchive(tasks, 'name_asc').map(t => t.title)).toEqual(['alpha', 'Mike', 'Zulu']);
        });

        it('reads a missing date as the epoch rather than throwing', () => {
            const undated = [
                { id: 1, title: 'a', completed_at: null, created_at: null },
                { id: 2, title: 'b', completed_at: at(1), created_at: at(1) },
            ];
            // Descending, so the epoch sorts last — this is the `|| 0` the store used
            // before the control existed, kept so a completed task with no timestamp
            // stays at the bottom of the archive where it has always been.
            expect(sortArchive(undated, 'completed_desc').map(t => t.id)).toEqual([2, 1]);
            expect(sortArchive(undated, 'created_desc').map(t => t.id)).toEqual([2, 1]);
        });

        it('tolerates a task with no title', () => {
            const unnamed = [
                { id: 1, completed_at: at(1) },
                { id: 2, title: 'Beta', completed_at: at(2) },
            ];
            expect(sortArchive(unnamed, 'name_asc').map(t => t.id)).toEqual([1, 2]);
        });

        it('does not mutate the array it is given', () => {
            const original = [...tasks];
            sortArchive(tasks, 'name_asc');
            expect(tasks).toEqual(original);
        });

        it('falls back to the default order for an unknown key', () => {
            expect(sortArchive(tasks, 'nope').map(t => t.id)).toEqual([1, 3, 2]);
        });
    });

    describe('hidden', () => {
        // `hidden_until` is in the future — `at(-1)` is an hour from now, so the ids read
        // in the opposite direction to the archive's.
        const tasks = [
            { id: 1, title: 'Zulu', hidden_until: at(-1), created_at: at(5) },
            { id: 2, title: 'alpha', hidden_until: at(-3), created_at: at(4) },
            { id: 3, title: 'Mike', hidden_until: at(-2), created_at: at(6) },
        ];

        it('defaults to return date, soonest first', () => {
            expect(sortHidden(tasks, DEFAULT_HIDDEN_SORT).map(t => t.id)).toEqual([1, 3, 2]);
        });

        it('sorts by creation date, newest first', () => {
            expect(sortHidden(tasks, 'created_desc').map(t => t.id)).toEqual([2, 1, 3]);
        });

        it('sorts by name', () => {
            expect(sortHidden(tasks, 'name_asc').map(t => t.title)).toEqual(['alpha', 'Mike', 'Zulu']);
        });

        it('reads a missing date as the epoch rather than throwing', () => {
            const undated = [
                { id: 1, title: 'a', hidden_until: null, created_at: null },
                { id: 2, title: 'b', hidden_until: at(-1), created_at: at(1) },
            ];
            // Ascending this time, so the epoch comes first. Unreachable through the UI —
            // `filteredTasks` only admits tasks that have a `hidden_until` — but the
            // comparator must not be the thing that decides that.
            expect(sortHidden(undated, 'appears_asc').map(t => t.id)).toEqual([1, 2]);
            expect(sortHidden(undated, 'created_desc').map(t => t.id)).toEqual([2, 1]);
        });

        it('tolerates tasks with no title', () => {
            const unnamed = [
                { id: 1, hidden_until: at(-1) },
                { id: 2, hidden_until: at(-2), title: 'Beta' },
            ];
            expect(sortHidden(unnamed, 'name_asc').map(t => t.id)).toEqual([1, 2]);
        });

        it('falls back to the default order for an unknown key', () => {
            expect(sortHidden(tasks, 'nope').map(t => t.id)).toEqual([1, 3, 2]);
        });
    });

    it('accepts a locale for the name comparison', () => {
        const tasks = [
            { id: 1, title: 'Ёж', completed_at: at(1) },
            { id: 2, title: 'Яблоко', completed_at: at(2) },
        ];
        expect(sortArchive(tasks, 'name_asc', 'ru').map(t => t.id)).toEqual([1, 2]);
    });

    describe('the name comparator itself', () => {
        // `sort` decides which operand it hands over first, so a missing title on the
        // left and on the right are exercised separately rather than by luck.
        const { name_asc: byName } = ARCHIVE_SORTS;

        it('treats a task with no title as the empty string on either side', () => {
            const titled = { title: 'Beta' };
            const untitled = {};
            expect(byName(untitled, titled)).toBeLessThan(0);
            expect(byName(titled, untitled)).toBeGreaterThan(0);
            expect(byName(untitled, {})).toBe(0);
        });

        it('is shared by the hidden map', () => {
            expect(HIDDEN_SORTS.name_asc).toBe(byName);
        });
    });
});
