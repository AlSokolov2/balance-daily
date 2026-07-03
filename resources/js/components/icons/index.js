/**
 * Central SVG icon registry for the Balance.Daily application.
 *
 * Each entry defines the icon's viewBox, default stroke-width, and one or more
 * path elements. The AppIcon component renders them with stroke="currentColor"
 * (or fill="currentColor" for filled icons) so they inherit text color.
 *
 * Naming: kebab-case, matching common icon names (Heroicons convention).
 */

export const icons = {
    // ── Navigation ──────────────────────────────────────────────

    home: {
        viewBox: '0 0 24 24',
        defaultStroke: 2.5,
        paths: [{ d: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' }],
    },

    stats: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z' }],
    },

    notepad: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }],
    },

    // ── Actions ─────────────────────────────────────────────────

    plus: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M12 6v6m0 0v6m0-6h6m-6 0H6' }],
    },

    close: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M6 18L18 6M6 6l12 12' }],
    },

    search: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z' }],
    },

    edit: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z' }],
    },

    trash: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-4v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16' }],
    },

    check: {
        viewBox: '0 0 24 24',
        defaultStroke: 3,
        paths: [{ d: 'M5 13l4 4L19 7' }],
    },

    settings: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [
            { d: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z' },
            { d: 'M15 12a3 3 0 11-6 0 3 3 0 016 0z' },
        ],
    },

    // ── Chevrons ────────────────────────────────────────────────

    'chevron-left': {
        viewBox: '0 0 24 24',
        defaultStroke: 2.5,
        paths: [{ d: 'M15 19l-7-7 7-7' }],
    },

    'chevron-right': {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M9 5l7 7-7 7' }],
    },

    'chevron-down': {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M19 9l-7 7-7-7' }],
    },

    // ── Utility ─────────────────────────────────────────────────

    logout: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1' }],
    },

    comment: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' }],
    },

    sync: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' }],
    },

    danger: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z' }],
    },

    lightbulb: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.364-6.364l-.707-.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M12 7a5 5 0 015 5 5 5 0 01-5 5 5 5 0 01-5-5 5 5 0 015-5z' }],
    },

    download: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4' }],
    },

    upload: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12' }],
    },

    box: {
        viewBox: '0 0 24 24',
        defaultStroke: 2.5,
        paths: [{ d: 'M19 11H5m14 0 a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10' }],
    },

    database: {
        viewBox: '0 0 24 24',
        defaultStroke: 2.5,
        paths: [{ d: 'M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4' }],
    },

    'check-circle': {
        viewBox: '0 0 20 20',
        defaultStroke: null,
        fill: 'currentColor',
        strokeLinecap: null,
        strokeLinejoin: null,
        paths: [{
            d: 'M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z',
            fillRule: 'evenodd',
            clipRule: 'evenodd',
        }],
    },

    // ── Brand / Custom ──────────────────────────────────────────

    vk: {
        viewBox: '0 0 24 24',
        defaultStroke: null,
        fill: 'currentColor',
        strokeLinecap: null,
        strokeLinejoin: null,
        paths: [{ d: 'M21.579 6.855c.14-.465 0-.806-.663-.806h-2.193c-.558 0-.813.295-.953.62 0 0-1.115 2.719-2.695 4.482-.51.513-.743.675-1.021.675-.14 0-.34-.162-.34-.628V6.855c0-.558-.157-.806-.626-.806H9.092c-.34 0-.546.253-.546.494 0 .52.775.64.855 2.103v3.177c0 .697-.125.825-.398.825-.744 0-2.556-2.736-3.63-5.868C5.163 6.22 4.953 6 4.39 6H2.197c-.623 0-.748.295-.748.62 0 .582.743 3.464 3.46 7.275 1.81 2.6 4.36 4.008 6.68 4.008 1.394 0 1.566-.313 1.566-.853v-1.966c0-.626.133-.752.574-.752.325 0 .884.163 2.187 1.42 1.49 1.49 1.735 2.157 2.574 2.157h2.193c.627 0 .94-.313.76-.931-.197-.615-.906-1.51-1.847-2.57-.51-.604-1.277-1.254-1.51-1.579-.325-.419-.232-.604 0-.976.001 0 2.672-3.761 2.95-5.04z' }],
    },

    google: {
        viewBox: '0 0 24 24',
        defaultStroke: null,
        fill: 'none',
        strokeLinecap: null,
        strokeLinejoin: null,
        paths: [
            { d: 'M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z', fill: '#4285F4' },
            { d: 'M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z', fill: '#34A853' },
            { d: 'M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z', fill: '#FBBC05' },
            { d: 'M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z', fill: '#EA4335' },
        ],
    },

    balance: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        fill: 'none',
        paths: [
            { d: 'm16 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z' },
            { d: 'm2 16 3-8 3 8c-.87.65-1.92 1-3 1s-2.13-.35-3-1Z' },
            { d: 'M7 21h10' },
            { d: 'M12 3v18' },
            { d: 'M3 7h2c2 0 5-1 7-2 2 1 5 2 7 2h2' },
        ],
    },

    // ── TaskItem action icons ──────────────────────────────────

    archive: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4' }],
    },

    restore: {
        viewBox: '0 0 24 24',
        defaultStroke: 2,
        paths: [{ d: 'M9 15L3 9m0 0l6-6M3 9h12a6 6 0 010 12h-3' }],
    },

    // ── Clipboard (used as subcategories tab icon in SettingsModal) ─

    clipboard: {
        viewBox: '0 0 24 24',
        defaultStroke: 2.5,
        paths: [{ d: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' }],
    },
};
