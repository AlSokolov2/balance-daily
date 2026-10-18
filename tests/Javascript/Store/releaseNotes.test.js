import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useReleaseNotesStore } from '../../../resources/js/stores/releaseNotes';

const NOTES = [
    { version: '2.17.0', date: '2026-10-01', items: [] },
    { version: '2.18.0', date: '2026-10-05', items: [] },
    { version: '2.19.0', date: '2026-10-18', items: [] },
    { version: '2.19.1', date: '2026-10-18', items: [] },
    { version: '2.20.0', date: '2026-11-01', items: [] },
];

/**
 * @param {string} [lastSeen] written to localStorage before the store is created
 * @returns {ReturnType<typeof useReleaseNotesStore>}
 */
function makeStore(lastSeen) {
    if (lastSeen !== undefined) localStorage.setItem('release_notes_seen_version', lastSeen);

    const store = useReleaseNotesStore();
    store.notes = NOTES;
    store.currentVersion = '2.19.0';

    return store;
}

describe('Release notes store (#211)', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('records the version on a first launch without showing the sheet', () => {
        const store = makeStore();

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
        expect(localStorage.getItem('release_notes_seen_version')).toBe('2.19.0');
    });

    it('shows the sheet once on a device that already ran 2.19.0', () => {
        // 2.19.0 wrote the old key silently for everyone; the new key is absent.
        localStorage.setItem('last_sync', '2026-10-18T10:00:00Z');
        localStorage.setItem('last_seen_version', '2.19.0');

        const store = useReleaseNotesStore();
        store.notes = NOTES;
        store.currentVersion = '2.19.1';

        store.checkAfterUpdate();

        expect(store.visible).toBe(true);
        expect(store.mode).toBe('update');
        expect(store.visibleNotes.map(note => note.version))
            .toEqual(['2.19.1', '2.19.0', '2.18.0', '2.17.0']);
    });

    it('shows the notes on an existing device that skipped 2.19.0', () => {
        localStorage.setItem('last_sync', '2026-10-18T10:00:00Z');

        const store = useReleaseNotesStore();
        store.notes = NOTES;
        store.currentVersion = '2.19.0';

        store.checkAfterUpdate();

        expect(store.visible).toBe(true);
        expect(store.visibleNotes.map(note => note.version))
            .toEqual(['2.19.0', '2.18.0', '2.17.0']);
    });

    it('does not open an empty sheet on an existing device', () => {
        localStorage.setItem('last_sync', '2026-10-18T10:00:00Z');

        const store = useReleaseNotesStore();
        store.notes = [{ version: '2.20.0', date: '2026-11-01', items: [] }];
        store.currentVersion = '2.19.1';

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.1');
    });

    it('does nothing when the version has not changed', () => {
        const store = makeStore('2.19.0');

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
    });

    it('shows notes newer than the last seen version', () => {
        const store = makeStore('2.18.0');

        store.checkAfterUpdate();

        expect(store.visible).toBe(true);
        expect(store.mode).toBe('update');
        expect(store.visibleNotes.map(note => note.version)).toEqual(['2.19.0']);
    });

    it('aggregates every skipped version, newest first', () => {
        const store = makeStore('2.16.0');

        store.checkAfterUpdate();

        expect(store.visibleNotes.map(note => note.version))
            .toEqual(['2.19.0', '2.18.0', '2.17.0']);
    });

    it('marks the version as seen when the update has no notes', () => {
        const store = makeStore('2.18.0');
        store.notes = [NOTES[0]];

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
        expect(localStorage.getItem('release_notes_seen_version')).toBe('2.19.0');
    });

    it('does not show notes after a rollback', () => {
        const store = makeStore('2.20.0');

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
    });

    it('shows the full history on demand', () => {
        const store = makeStore('2.19.0');

        store.openHistory();

        expect(store.visible).toBe(true);
        expect(store.mode).toBe('history');
        expect(store.visibleNotes.map(note => note.version))
            .toEqual(['2.20.0', '2.19.1', '2.19.0', '2.18.0', '2.17.0']);
        expect(store.lastSeen).toBe('2.19.0');
    });

    it('dismiss hides the sheet and records the version', () => {
        const store = makeStore('2.18.0');
        store.checkAfterUpdate();

        store.dismiss();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
        expect(localStorage.getItem('release_notes_seen_version')).toBe('2.19.0');
    });

    it('treats a corrupt stored version as a first launch', () => {
        const store = makeStore('not-a-version');

        expect(store.lastSeen).toBeNull();

        store.checkAfterUpdate();

        expect(store.visible).toBe(false);
        expect(store.lastSeen).toBe('2.19.0');
    });

    it('lists notes up to the current version when nothing has been seen yet', () => {
        const store = makeStore();
        store.lastSeen = null;

        expect(store.visibleNotes.map(note => note.version))
            .toEqual(['2.19.0', '2.18.0', '2.17.0']);
    });

    it('survives blocked storage', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        const store = makeStore();
        expect(store.lastSeen).toBeNull();

        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        expect(() => store.checkAfterUpdate()).not.toThrow();
        expect(store.lastSeen).toBe('2.19.0');
        expect(store.visible).toBe(false);
    });
});
