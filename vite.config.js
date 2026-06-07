import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import { bunny } from 'laravel-vite-plugin/fonts';
import tailwindcss from '@tailwindcss/vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { readFileSync } from 'fs';

const packageJson = JSON.parse(readFileSync('./package.json', 'utf-8'));

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    
    return {
        base: '/',
        define: {
            __APP_VERSION__: JSON.stringify(packageJson.version),
            __VAPID_PUBLIC_KEY__: JSON.stringify(env.VAPID_PUBLIC_KEY || ''),
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.js'],
                refresh: true,
                fonts: [
                    bunny('Instrument Sans', {
                        weights: [400, 500, 600],
                    }),
                ],
            }),
            vue({
                template: {
                    transformAssetUrls: {
                        base: null,
                        includeAbsolute: false,
                    },
                },
            }),
            tailwindcss(),
            VitePWA({
                outDir: 'public',
                strategies: 'injectManifest',
                srcDir: 'resources/js',
                filename: 'sw.js',
                registerType: 'prompt',
                injectRegister: 'auto',
                includeAssets: ['favicon.svg', 'robots.txt'],
                devOptions: {
                    enabled: true,
                    type: 'module',
                },
                manifest: {
                    name: 'Баланс.Дейли',
                    short_name: 'Баланс',
                    description: 'Ваш помощник для управления балансом жизни и задачами',
                    theme_color: '#f5f5f7',
                    background_color: '#f5f5f7',
                    display: 'standalone',
                    start_url: '../',
                    scope: '../',
                    icons: [
                        {
                            src: '/favicon.svg',
                            sizes: 'any',
                            type: 'image/svg+xml',
                            purpose: 'any'
                        },
                        {
                            src: '/favicon.svg',
                            sizes: '192x192',
                            type: 'image/svg+xml',
                            purpose: 'any'
                        },
                        {
                            src: '/favicon.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            purpose: 'maskable'
                        }
                    ],
                    screenshots: [
                        {
                            src: '/favicon.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            form_factor: 'wide',
                            label: 'Application Desktop'
                        },
                        {
                            src: '/favicon.svg',
                            sizes: '512x512',
                            type: 'image/svg+xml',
                            form_factor: 'narrow',
                            label: 'Application Mobile'
                        }
                    ]
                },
                injectManifest: {
                    rollupOptions: {
                        output: {
                            codeSplitting: false,
                        },
                    },
                },
                workbox: {
                    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff,woff2}'],
                    navigateFallback: null,
                    navigateFallbackDenylist: [/^\/api/],
                },
                devOptions: {
                    enabled: true,
                    type: 'module',
                }
            })
        ],
        server: {
            watch: {
                ignored: ['**/storage/framework/views/**'],
            },
        },
        test: {
            globals: true,
            environment: 'jsdom',
            setupFiles: ['./tests/Javascript/setup.js'],
            exclude: ['**/node_modules/**', '**/dist/**', '**/.local/**'],
            coverage: {
                provider: 'v8',
                include: ['resources/js/stores/**', 'resources/js/utils/**'],
                reporter: ['text', 'json', 'html'],
                thresholds: {
                    lines: 95,
                    functions: 85,
                    branches: 80,
                    statements: 90
                }
            }
        },
    };
});
