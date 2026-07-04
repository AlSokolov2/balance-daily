/**
 * Unit tests for auth Pinia store.
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createPinia, setActivePinia } from 'pinia';
import { useAuthStore } from '../../../resources/js/stores/auth';
import axios from 'axios';

vi.mock('axios');

describe('Auth Store', () => {
    beforeEach(() => {
        setActivePinia(createPinia());
        localStorage.clear();
        vi.clearAllMocks();
        delete axios.defaults.headers.common['Authorization'];
    });

    it('has correct default state', () => {
        const auth = useAuthStore();
        expect(auth.token).toBeNull();
        expect(auth.user).toBeNull();
        expect(auth.isAuthenticated).toBe(false);
    });

    it('reads token from localStorage', () => {
        localStorage.setItem('auth_token', 'stored-token');
        setActivePinia(createPinia());
        const auth = useAuthStore();
        expect(auth.token).toBe('stored-token');
        expect(auth.isAuthenticated).toBe(true);
    });

    it('googleAuthUrl returns correct URL', () => {
        window.apiBaseUrl = 'https://api.example.com';
        setActivePinia(createPinia());
        const auth = useAuthStore();
        expect(auth.googleAuthUrl).toBe('https://api.example.com/auth/google');
    });

    it('googleAuthUrl handles missing apiBaseUrl', () => {
        window.apiBaseUrl = undefined;
        setActivePinia(createPinia());
        const auth = useAuthStore();
        expect(auth.googleAuthUrl).toBe('/auth/google');
    });

    it('vkAuthUrl returns correct URL', () => {
        window.apiBaseUrl = 'https://api.example.com';
        setActivePinia(createPinia());
        const auth = useAuthStore();
        expect(auth.vkAuthUrl).toBe('https://api.example.com/auth/vkid');
    });

    it('init exchanges OAuth code and fetches user', async () => {
        // Simulate OAuth code in URL
        const originalSearch = window.location.search;
        Object.defineProperty(window, 'location', {
            value: { search: '?code=oauth-code-123', pathname: '/' },
            writable: true,
        });
        vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});

        axios.post.mockResolvedValueOnce({ data: { token: 'new-token' } });
        axios.get.mockResolvedValueOnce({ data: { id: 1, name: 'Test' } });

        const auth = useAuthStore();
        await auth.init();

        expect(auth.token).toBe('new-token');
        expect(localStorage.getItem('auth_token')).toBe('new-token');
        expect(auth.user).toEqual({ id: 1, name: 'Test' });
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer new-token');
    });

    it('init without token does nothing', async () => {
        const auth = useAuthStore();
        await auth.init();

        expect(auth.token).toBeNull();
        expect(auth.user).toBeNull();
    });

    it('init with existing token fetches user', async () => {
        localStorage.setItem('auth_token', 'existing-token');
        setActivePinia(createPinia());
        axios.get.mockResolvedValueOnce({ data: { id: 2, name: 'Existing' } });

        const auth = useAuthStore();
        await auth.init();

        expect(auth.user).toEqual({ id: 2, name: 'Existing' });
        expect(axios.defaults.headers.common['Authorization']).toBe('Bearer existing-token');
    });

    it('init handles code exchange error gracefully', async () => {
        Object.defineProperty(window, 'location', {
            value: { search: '?code=bad-code', pathname: '/' },
            writable: true,
        });
        vi.spyOn(window.history, 'replaceState').mockImplementation(() => {});
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        axios.post.mockRejectedValueOnce(new Error('Exchange failed'));

        const auth = useAuthStore();
        await auth.init();

        expect(spy).toHaveBeenCalled();
        expect(auth.token).toBeNull();
        spy.mockRestore();
    });

    it('logout clears auth state', async () => {
        const auth = useAuthStore();
        auth.token = 'my-token';
        auth.user = { id: 1 };
        axios.defaults.headers.common['Authorization'] = 'Bearer my-token';
        axios.post.mockResolvedValueOnce({});

        await auth.logout();

        expect(auth.token).toBeNull();
        expect(auth.user).toBeNull();
        expect(localStorage.getItem('auth_token')).toBeNull();
        expect(axios.defaults.headers.common['Authorization']).toBeUndefined();
    });

    it('logout without token skips POST', async () => {
        const auth = useAuthStore();
        await auth.logout();
        expect(axios.post).not.toHaveBeenCalled();
    });

    it('logout handles server error gracefully', async () => {
        const auth = useAuthStore();
        auth.token = 'my-token';
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
        axios.post.mockRejectedValueOnce(new Error('Server error'));

        await auth.logout();

        expect(spy).toHaveBeenCalled();
        expect(auth.token).toBeNull(); // Still cleared
        spy.mockRestore();
    });
});
