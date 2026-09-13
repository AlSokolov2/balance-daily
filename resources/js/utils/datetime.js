/**
 * Date/time helpers for Balance.Daily.
 *
 * The API contract is UTC instants (ISO-8601 with `Z`), while
 * `<input type="datetime-local">` works with naive local wall-clock strings.
 * These two functions are the only place where the two representations meet.
 *
 * @see #152
 */

/**
 * Converts a UTC ISO string from the API into a value for `<input type="datetime-local">`.
 *
 * @param {string|null|undefined} iso - UTC ISO string (e.g. '2026-09-12T11:30:00.000000Z')
 * @returns {string} Local wall-clock value ('YYYY-MM-DDTHH:mm'), or '' when absent/invalid
 */
export function toLocalInputValue(iso) {
    if (!iso) return '';

    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';

    const pad = (n) => String(n).padStart(2, '0');

    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
        + `T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/**
 * Converts a `<input type="datetime-local">` value into a UTC ISO string for the API.
 *
 * A value without a timezone offset is parsed as local time, which is exactly what the
 * input produces; a value that already carries one yields the same instant, so the
 * conversion is idempotent.
 *
 * @param {string|null|undefined} value - Local wall-clock value ('YYYY-MM-DDTHH:mm')
 * @returns {string|null} UTC ISO string, or null when absent/invalid
 */
export function fromLocalInputValue(value) {
    if (!value) return null;

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toISOString();
}
