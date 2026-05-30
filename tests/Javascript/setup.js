import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Global defines
global.__APP_VERSION__ = '2.0.9';
global.__VAPID_PUBLIC_KEY__ = 'fake-vapid-key';

// Mock virtual:pwa-register/vue
vi.mock('virtual:pwa-register/vue', () => ({
    useRegisterSW: () => ({
        offlineReady: { value: false },
        needRefresh: { value: false },
        updateServiceWorker: vi.fn(),
    }),
}));

// Mock vue-i18n
config.global.mocks = {
    $t: (msg) => msg,
    $tm: (msg) => []
};

vi.mock('vue-i18n', () => ({
    useI18n: () => ({
        t: (msg) => msg,
        tm: (msg) => [],
        locale: { value: 'ru' }
    }),
    createI18n: () => ({
        install: () => {}
    })
}));
