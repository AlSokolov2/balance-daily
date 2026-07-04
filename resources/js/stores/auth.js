/**
 * Auth store — token, user, OAuth URLs.
 * Orchestration (sync, pulse, tasks cleanup) stays in balance wrappers.
 *
 * @see #129 — Split monolith store
 */
import { defineStore } from 'pinia';
import axios from 'axios';

export const useAuthStore = defineStore('auth', {
    state: () => ({
        token: localStorage.getItem('auth_token') || null,
        user: null,
    }),

    getters: {
        isAuthenticated: (state) => !!state.token,
        googleAuthUrl: () => (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/google',
        vkAuthUrl: () => (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/vkid',
    },

    actions: {
        /**
         * Exchange OAuth code, load user. Does NOT call sync/startPulse —
         * that is orchestrated by the balance store wrapper.
         */
        async init() {
            const urlParams = new window.URLSearchParams(window.location.search);
            const codeFromUrl = urlParams.get('code');
            if (codeFromUrl) {
                window.history.replaceState({}, document.title, window.location.pathname);
                try {
                    const res = await axios.post('auth/exchange-code', { code: codeFromUrl });
                    this.token = res.data.token;
                    localStorage.setItem('auth_token', this.token);
                } catch (e) {
                    console.error('Code exchange error:', e);
                }
            }

            if (this.token) {
                axios.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
                const res = await axios.get('user');
                this.user = res.data;
            }
        },

        /**
         * Revoke token, clear auth state. Does NOT clean tasks/pulse —
         * that is orchestrated by the balance store wrapper.
         */
        async logout() {
            if (this.token) {
                try {
                    await axios.post('logout');
                } catch (e) {
                    console.error('Logout error:', e);
                }
            }
            this.token = null;
            this.user = null;
            localStorage.removeItem('auth_token');
            delete axios.defaults.headers.common['Authorization'];
        },
    },
});

/**
 * URL-safe base64 → Uint8Array (for Web Push).
 * Plain utility — not part of auth state.
 */
export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}
