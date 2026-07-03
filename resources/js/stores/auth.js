/**
 * Auth module — init and logout logic extracted from balance store.
 * Not a Pinia store — just functions that operate on a store instance.
 *
 * @see #129 — Split monolith store
 */
import axios from 'axios';

/**
 * Exchange OAuth code, load user, trigger sync.
 * @param {Object} store — balance store instance
 */
export async function initAuth(store) {
    const urlParams = new window.URLSearchParams(window.location.search);
    const codeFromUrl = urlParams.get('code');
    if (codeFromUrl) {
        window.history.replaceState({}, document.title, window.location.pathname);
        try {
            const res = await axios.post('auth/exchange-code', { code: codeFromUrl });
            store.token = res.data.token;
            localStorage.setItem('auth_token', store.token);
        } catch (e) {
            console.error('Code exchange error:', e);
        }
    }

    if (store.token) {
        axios.defaults.headers.common['Authorization'] = `Bearer ${store.token}`;
        try {
            const res = await axios.get('user');
            store.user = res.data;
            await store.sync();
            store.startPulse();
        } catch (e) {
            console.error('Init error:', e);
            await store.logout();
        }
    }
}

/**
 * Clear all state, revoke token.
 * @param {Object} store — balance store instance
 */
export async function logoutAuth(store) {
    store.stopPulse();
    if (store.token) {
        try { await axios.post('logout'); } catch (e) { console.error('Logout error:', e); }
    }
    store.token = null;
    store.user = null;
    store.lastSync = null;
    localStorage.removeItem('auth_token');
    localStorage.removeItem('last_sync');
    delete axios.defaults.headers.common['Authorization'];
    store.tasks = [];
    store.categories = [];
    store.subcatCoeffs = {};
    await store.sync(true);
}

/**
 * Google OAuth URL.
 */
export function googleAuthUrl() {
    return (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/google';
}

/**
 * VK ID OAuth URL.
 */
export function vkAuthUrl() {
    return (window.apiBaseUrl || '').replace(/\/$/, '') + '/auth/vkid';
}

/**
 * URL-safe base64 → Uint8Array (for Web Push).
 */
export function urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) { outputArray[i] = rawData.charCodeAt(i); }
    return outputArray;
}
