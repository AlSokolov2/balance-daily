import { describe, it, expect } from 'vitest';
import { compareVersions } from '../../../resources/js/utils/version';

describe('compareVersions', () => {
    it('returns 0 for equal versions', () => {
        expect(compareVersions('2.19.0', '2.19.0')).toBe(0);
    });

    it('compares segments numerically, not lexically', () => {
        expect(compareVersions('2.10.0', '2.9.0')).toBe(1);
        expect(compareVersions('2.9.0', '2.10.0')).toBe(-1);
    });

    it('returns 1 for a newer version', () => {
        expect(compareVersions('2.19.1', '2.19.0')).toBe(1);
    });

    it('returns -1 for an older version', () => {
        expect(compareVersions('2.18.9', '2.19.0')).toBe(-1);
    });

    it('treats missing segments as zero', () => {
        expect(compareVersions('2.19', '2.19.0')).toBe(0);
        expect(compareVersions('2.19', '2.19.1')).toBe(-1);
        expect(compareVersions('2.19.1', '2.19')).toBe(1);
    });
});
