import { vi } from 'vitest';
import { config } from '@vue/test-utils';

// Global defines
global.__APP_VERSION__ = '2.1.4';
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
    $tm: (msg) => [],
    $route: { name: 'home', path: '/' },
    $router: { push: vi.fn() }
};

config.global.stubs = {
    'router-link': { template: '<a><slot /></a>' },
    'router-view': { 
        template: '<div><slot :Component="{ template: \'<div>mock</div>\' }" :route="{ path: \'/\', name: \'home\' }" /></div>' 
    }
};

const mockPush = vi.fn();

vi.mock('vue-router', () => ({
    useRouter: () => ({
        push: mockPush,
    }),
    useRoute: () => ({
        name: 'home',
        path: '/',
        params: {}
    }),
    createRouter: () => ({
        install: () => {},
        push: vi.fn(),
    }),
    createWebHashHistory: vi.fn(),
}));

// Export the mock push so tests can assert on it
export { mockPush };

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
