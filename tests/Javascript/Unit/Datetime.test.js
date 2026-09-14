/**
 * Tests for resources/js/utils/datetime.js (#152).
 *
 * These tests must stay timezone-agnostic: the developer machine runs in MSK while CI
 * runs in UTC, so asserting an absolute UTC string derived from local wall-clock time
 * would pass locally and fail in CI. Everything below therefore checks either the shape
 * of the string, the local date components, or a round-trip.
 */
import { describe, it, expect } from 'vitest';
import { toLocalInputValue, fromLocalInputValue } from '../../../resources/js/utils/datetime';

describe('datetime utils (#152)', () => {
    /** Local components of an instant — the same ones `datetime-local` renders. */
    const localParts = (value) => {
        const d = new Date(value);
        return [d.getFullYear(), d.getMonth() + 1, d.getDate(), d.getHours(), d.getMinutes()];
    };

    describe('toLocalInputValue', () => {
        it('returns an empty string for missing values', () => {
            expect(toLocalInputValue(null)).toBe('');
            expect(toLocalInputValue(undefined)).toBe('');
            expect(toLocalInputValue('')).toBe('');
        });

        it('returns an empty string for an unparsable value', () => {
            expect(toLocalInputValue('not-a-date')).toBe('');
        });

        it('renders the local wall-clock time of the instant', () => {
            const iso = '2026-09-12T14:30:00.000000Z';
            const result = toLocalInputValue(iso);

            // Shape accepted by <input type="datetime-local">: no seconds, no Z
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/);
            // The very instant the API sent, expressed in the browser's zone
            expect(new Date(result).getTime()).toBe(new Date(iso).getTime());
            expect(localParts(result)).toEqual(localParts(iso));
        });
    });

    describe('fromLocalInputValue', () => {
        it('returns null for missing values', () => {
            expect(fromLocalInputValue(null)).toBeNull();
            expect(fromLocalInputValue(undefined)).toBeNull();
            expect(fromLocalInputValue('')).toBeNull();
        });

        it('returns null for an unparsable value', () => {
            expect(fromLocalInputValue('not-a-date')).toBeNull();
        });

        it('returns the UTC instant matching the typed wall-clock time', () => {
            const typed = '2026-09-12T14:30';
            const result = fromLocalInputValue(typed);

            // Contract of the API: ISO-8601 with an explicit Z
            expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
            // Same moment the browser reads for the typed value
            expect(new Date(result).getTime()).toBe(new Date(typed).getTime());
            // Local components did not drift
            expect(localParts(result)).toEqual([2026, 9, 12, 14, 30]);
        });
    });

    describe('round-trip', () => {
        it('preserves the instant across API -> input -> API', () => {
            [
                '2026-09-12T14:30:00.000Z',
                '2026-01-01T00:00:00.000Z',
                '2026-12-31T23:59:00.000Z',
            ].forEach((iso) => {
                expect(fromLocalInputValue(toLocalInputValue(iso))).toBe(iso);
            });
        });

        it('drops sub-minute precision only', () => {
            expect(fromLocalInputValue(toLocalInputValue('2026-09-12T14:30:47.123Z')))
                .toBe('2026-09-12T14:30:00.000Z');
        });

        it('gives the user back exactly the time they typed', () => {
            expect(toLocalInputValue(fromLocalInputValue('2026-09-12T14:30'))).toBe('2026-09-12T14:30');
        });
    });
});
