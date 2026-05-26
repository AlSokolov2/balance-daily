import { describe, it, expect, vi } from 'vitest';
import axios from 'axios';

// Function to simulate the logic from bootstrap.js
function configureAxios(windowMock) {
    const rawBaseUrl = windowMock.apiBaseUrl || windowMock.location.origin + windowMock.location.pathname.replace(/\/$/, '');
    const cleanBaseUrl = rawBaseUrl.replace(/\/$/, '');
    return cleanBaseUrl + '/api/';
}

describe('Dynamic Routing & Subdirectory Support', () => {
    
    it('configures correct API baseURL when installed in ROOT', () => {
        const windowMock = {
            apiBaseUrl: 'https://mysite.com',
            location: { origin: 'https://mysite.com', pathname: '/' }
        };
        
        const finalUrl = configureAxios(windowMock);
        expect(finalUrl).toBe('https://mysite.com/api/');
    });

    it('configures correct API baseURL when installed in SUBDIRECTORY /daily', () => {
        const windowMock = {
            apiBaseUrl: 'https://mysite.com/daily',
            location: { origin: 'https://mysite.com', pathname: '/daily/' }
        };
        
        const finalUrl = configureAxios(windowMock);
        expect(finalUrl).toBe('https://mysite.com/daily/api/');
    });

    it('configures correct API baseURL when installed in DEEP SUBDIRECTORY /apps/productivity/balance', () => {
        const windowMock = {
            apiBaseUrl: 'https://mysite.com/apps/productivity/balance',
            location: { origin: 'https://mysite.com', pathname: '/apps/productivity/balance/' }
        };
        
        const finalUrl = configureAxios(windowMock);
        expect(finalUrl).toBe('https://mysite.com/apps/productivity/balance/api/');
    });

    it('handles missing apiBaseUrl by fallback to current location', () => {
        const windowMock = {
            apiBaseUrl: undefined,
            location: { origin: 'https://demo.io', pathname: '/test-folder/' }
        };
        
        const finalUrl = configureAxios(windowMock);
        expect(finalUrl).toBe('https://demo.io/test-folder/api/');
    });
});
