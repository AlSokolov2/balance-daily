/**
 * Unit tests for settings Pinia store.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useSettingsStore } from '../../../resources/js/stores/settings';
import axios from 'axios';

vi.mock('axios');

describe('Settings Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
    });

    it('has correct default state', () => {
        const settings = useSettingsStore();
        expect(settings.theme).toBe('system');
        expect(settings.locale).toBe('ru');
        expect(settings.pulseInterval).toBe(1);
    });

    it('reads locale and pulseInterval from localStorage', () => {
        localStorage.setItem('locale', 'en');
        localStorage.setItem('pulse_interval', '5');
        setActivePinia(createPinia());
        const settings = useSettingsStore();

        expect(settings.locale).toBe('en');
        expect(settings.pulseInterval).toBe(5);
    });

    it('setTheme updates state and calls applyTheme', async () => {
        const settings = useSettingsStore();
        axios.post.mockResolvedValueOnce({});

        await settings.setTheme('dark');

        expect(settings.theme).toBe('dark');
        expect(document.documentElement.classList.contains('dark')).toBe(true);
        expect(axios.post).toHaveBeenCalledWith('settings', { settings: { theme: 'dark' } });
    });

    it('setTheme with system respects prefers-color-scheme', async () => {
        const settings = useSettingsStore();
        axios.post.mockResolvedValueOnce({});

        await settings.setTheme('system');

        expect(settings.theme).toBe('system');
        // system falls back to no-dark-class when matchMedia returns false
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });

    it('setLocale updates state and localStorage', async () => {
        const settings = useSettingsStore();
        axios.post.mockResolvedValueOnce({});

        await settings.setLocale('en');

        expect(settings.locale).toBe('en');
        expect(localStorage.getItem('locale')).toBe('en');
        expect(axios.post).toHaveBeenCalledWith('settings', { settings: { locale: 'en' } });
    });

    it('setPulseInterval updates state and localStorage', async () => {
        const settings = useSettingsStore();
        axios.post.mockResolvedValueOnce({});

        await settings.setPulseInterval(15);

        expect(settings.pulseInterval).toBe(15);
        expect(localStorage.getItem('pulse_interval')).toBe('15');
        expect(axios.post).toHaveBeenCalledWith('settings', { settings: { pulse_interval: 15 } });
    });

    it('setPulseInterval parses string input', async () => {
        const settings = useSettingsStore();
        axios.post.mockResolvedValueOnce({});

        await settings.setPulseInterval('30');

        expect(settings.pulseInterval).toBe(30);
    });

    it('applyTheme adds dark class for dark theme', () => {
        const settings = useSettingsStore();
        settings.theme = 'dark';
        settings.applyTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(true);
    });

    it('applyTheme removes dark class for light theme', () => {
        const settings = useSettingsStore();
        settings.theme = 'dark';
        settings.applyTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(true);

        settings.theme = 'light';
        settings.applyTheme();
        expect(document.documentElement.classList.contains('dark')).toBe(false);
    });
});
