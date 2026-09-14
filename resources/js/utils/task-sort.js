/**
 * Sorting for the archive and hidden lists (#155).
 *
 * Two separate sets, because the natural fields differ: an archived task is dated by when
 * it was completed, a hidden one by when it comes back. Both lists share creation date and
 * title, which are the two the reporter asked for by name.
 *
 * Every comparator takes `(a, b, locale)` so the caller can pass one function reference
 * around; only the title comparison actually reads the locale.
 */

/** @param {*} value */
const time = (value) => (value ? new Date(value).getTime() : 0);

/** Newest first, `0` for a missing date so undated rows sink to the bottom. */
const byDateDesc = (field) => (a, b) => time(b[field]) - time(a[field]);

/** Oldest first — the hidden list reads as a queue. */
const byDateAsc = (field) => (a, b) => time(a[field]) - time(b[field]);

const byTitleAsc = (a, b, locale) =>
    (a.title || '').localeCompare(b.title || '', locale, { sensitivity: 'base' });

/** The keys are also the i18n suffixes: `app.sort.<key>`. */
export const ARCHIVE_SORTS = {
    completed_desc: byDateDesc('completed_at'),
    created_desc: byDateDesc('created_at'),
    name_asc: byTitleAsc,
};

export const HIDDEN_SORTS = {
    appears_asc: byDateAsc('hidden_until'),
    created_desc: byDateDesc('created_at'),
    name_asc: byTitleAsc,
};

/** Order the lists are shown in the sort bar. */
export const ARCHIVE_SORT_KEYS = Object.keys(ARCHIVE_SORTS);
export const HIDDEN_SORT_KEYS = Object.keys(HIDDEN_SORTS);

export const DEFAULT_ARCHIVE_SORT = 'completed_desc';
export const DEFAULT_HIDDEN_SORT = 'appears_asc';

/**
 * Sorted copy of `tasks`. An unknown key falls back to the section default rather than
 * leaving the list unsorted.
 *
 * @param {Object[]} tasks
 * @param {Object<string, Function>} sorts
 * @param {string} fallback
 * @param {string} sortKey
 * @param {string} [locale]
 * @returns {Object[]}
 */
function sortWith(tasks, sorts, fallback, sortKey, locale) {
    const compare = sorts[sortKey] || sorts[fallback];
    return [...tasks].sort((a, b) => compare(a, b, locale));
}

/** @param {Object[]} tasks @param {string} sortKey @param {string} [locale] */
export function sortArchive(tasks, sortKey, locale) {
    return sortWith(tasks, ARCHIVE_SORTS, DEFAULT_ARCHIVE_SORT, sortKey, locale);
}

/** @param {Object[]} tasks @param {string} sortKey @param {string} [locale] */
export function sortHidden(tasks, sortKey, locale) {
    return sortWith(tasks, HIDDEN_SORTS, DEFAULT_HIDDEN_SORT, sortKey, locale);
}
