/**
 * Release notes — show "what's new" once after the app version changes.
 *
 * The bundle carries the notes for its own version, so the sheet is shown
 * after the new service worker has reloaded the page, not before.
 *
 * @see #211
 */
import { defineStore } from 'pinia';
import releaseNotes from '../release-notes.json';
import { compareVersions } from '../utils/version';

const LAST_SEEN_KEY = 'last_seen_version';
const VERSION_PATTERN = /^\d+(\.\d+)*$/;

/**
 * Read the last version this device has acknowledged. A corrupt or blocked
 * storage entry is treated as a first launch.
 *
 * @returns {string|null}
 */
function readLastSeen() {
    try {
        const stored = localStorage.getItem(LAST_SEEN_KEY);
        return stored && VERSION_PATTERN.test(stored) ? stored : null;
    } catch {
        return null;
    }
}

/**
 * @param {string} version
 */
function writeLastSeen(version) {
    try {
        localStorage.setItem(LAST_SEEN_KEY, version);
    } catch {
        // Private mode / blocked storage: the sheet is a convenience, not state.
    }
}

export const useReleaseNotesStore = defineStore('releaseNotes', {
    state: () => ({
        notes: releaseNotes,
        currentVersion: __APP_VERSION__,
        lastSeen: readLastSeen(),
        visible: false,
        mode: 'update',
    }),

    getters: {
        /**
         * Notes to render: only versions newer than the last seen one for an
         * update, everything for the history view. Newest version first.
         */
        visibleNotes: (state) => {
            const list = state.mode === 'history'
                ? state.notes
                : state.notes.filter(note =>
                    (!state.lastSeen || compareVersions(note.version, state.lastSeen) > 0) &&
                    compareVersions(note.version, state.currentVersion) <= 0);

            return [...list].sort((a, b) => compareVersions(b.version, a.version));
        },
    },

    actions: {
        /**
         * Show the sheet when the running bundle is newer than the last one
         * this device has seen. A first launch only records the version.
         */
        checkAfterUpdate() {
            if (!this.lastSeen) {
                this.markSeen();
                return;
            }

            if (this.lastSeen === this.currentVersion) return;

            const hasUnseen = this.notes.some(note =>
                compareVersions(note.version, this.lastSeen) > 0 &&
                compareVersions(note.version, this.currentVersion) <= 0);

            if (!hasUnseen) {
                this.markSeen();
                return;
            }

            this.mode = 'update';
            this.visible = true;
        },

        openHistory() {
            this.mode = 'history';
            this.visible = true;
        },

        dismiss() {
            this.visible = false;
            this.markSeen();
        },

        markSeen() {
            this.lastSeen = this.currentVersion;
            writeLastSeen(this.currentVersion);
        },
    },
});
