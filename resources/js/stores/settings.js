/**
 * Settings module — theme, locale, pulse interval.
 * Plain functions that operate on a store instance.
 *
 * @see #129 — Split monolith store
 */
import axios from 'axios';

/**
 * Set theme and persist to server.
 * @param {Object} store — balance store instance
 * @param {string} t — 'light' | 'dark' | 'system'
 */
export async function setTheme(store, t) {
    store.theme = t;
    store.applyTheme();
    await axios.post('settings', { settings: { theme: t } });
}

/**
 * Set locale and persist to localStorage + server.
 * @param {Object} store — balance store instance
 * @param {string} l — 'ru' | 'en'
 */
export async function setLocale(store, l) {
    store.locale = l;
    localStorage.setItem('locale', l);
    await axios.post('settings', { settings: { locale: l } });
}

/**
 * Set pulse interval and restart timer.
 * @param {Object} store — balance store instance
 * @param {number|string} m — minutes
 */
export async function setPulseInterval(store, m) {
    store.pulseInterval = parseInt(m);
    localStorage.setItem('pulse_interval', m);
    store.startPulse();
    await axios.post('settings', { settings: { pulse_interval: m } });
}

/**
 * Apply theme to document root (dark class toggle).
 * @param {Object} store — balance store instance
 */
export function applyTheme(store) {
    const isDark = store.theme === 'dark' || (store.theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
    document.documentElement.classList.toggle('dark', isDark);
}
