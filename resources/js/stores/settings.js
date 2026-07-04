/**
 * Settings store — theme, locale, pulse interval.
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import axios from 'axios';

export const useSettingsStore = defineStore('settings', {
    state: () => ({
        theme: 'system',
        locale: localStorage.getItem('locale') || 'ru',
        pulseInterval: parseInt(localStorage.getItem('pulse_interval')) || 1,
    }),

    actions: {
        async setTheme(t) {
            this.theme = t;
            this.applyTheme();
            await axios.post('settings', { settings: { theme: t } });
        },

        async setLocale(l) {
            this.locale = l;
            localStorage.setItem('locale', l);
            await axios.post('settings', { settings: { locale: l } });
        },

        async setPulseInterval(m) {
            this.pulseInterval = parseInt(m);
            localStorage.setItem('pulse_interval', m);
            await axios.post('settings', { settings: { pulse_interval: m } });
        },

        applyTheme() {
            const isDark = this.theme === 'dark' || (this.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
            document.documentElement.classList.toggle('dark', isDark);
        },
    },
});
