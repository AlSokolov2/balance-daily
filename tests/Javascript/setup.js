import { vi } from 'vitest';

// Mock virtual:pwa-register/vue
vi.mock('virtual:pwa-register/vue', () => ({
    useRegisterSW: () => ({
        offlineReady: { value: false },
        needRefresh: { value: false },
        updateServiceWorker: vi.fn(),
    }),
}));
