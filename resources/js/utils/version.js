/**
 * Compare two dotted numeric versions ("2.18.0").
 *
 * Semver pre-release suffixes are not used by this project, so a plain
 * component-wise numeric comparison is enough.
 *
 * @param {string} a
 * @param {string} b
 * @returns {number} -1 when a < b, 1 when a > b, 0 when equal
 */
export function compareVersions(a, b) {
    const left = String(a).split('.').map(Number);
    const right = String(b).split('.').map(Number);
    const length = Math.max(left.length, right.length);

    for (let i = 0; i < length; i++) {
        const l = left[i] || 0;
        const r = right[i] || 0;

        if (l !== r) return l > r ? 1 : -1;
    }

    return 0;
}
