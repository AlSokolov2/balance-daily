import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { useToast } from '../../../resources/js/composables/useToast';

describe('useToast Composable', () => {
    let toast;

    beforeEach(() => {
        vi.useFakeTimers();
        toast = useToast();
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('starts with no message and not visible', () => {
        expect(toast.message.value).toBeNull();
        expect(toast.visible.value).toBe(false);
    });

    it('shows message and becomes visible', () => {
        toast.show('Saved');

        expect(toast.message.value).toBe('Saved');
        expect(toast.visible.value).toBe(true);
    });

    it('auto-hides after default 2000ms', () => {
        toast.show('Saved');

        vi.advanceTimersByTime(1999);
        expect(toast.visible.value).toBe(true);

        vi.advanceTimersByTime(1);
        expect(toast.visible.value).toBe(false);
        expect(toast.message.value).toBeNull();
    });

    it('respects custom duration', () => {
        toast.show('Quick', 500);

        vi.advanceTimersByTime(499);
        expect(toast.visible.value).toBe(true);

        vi.advanceTimersByTime(1);
        expect(toast.visible.value).toBe(false);
    });

    it('resets timer on second show call', () => {
        toast.show('First');
        vi.advanceTimersByTime(1500);

        // Second call resets the timer
        toast.show('Second');
        vi.advanceTimersByTime(1500);
        expect(toast.visible.value).toBe(true);
        expect(toast.message.value).toBe('Second');

        vi.advanceTimersByTime(500);
        expect(toast.visible.value).toBe(false);
    });

    it('shared state across multiple useToast calls', () => {
        const a = useToast();
        const b = useToast();

        a.show('Hello');

        expect(b.message.value).toBe('Hello');
        expect(b.visible.value).toBe(true);
    });
});
