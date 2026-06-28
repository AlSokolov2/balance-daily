<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Баланс.Дейли</title>
    <link rel="icon" type="image/svg+xml" href="{{ asset('favicon.svg') }}">
    <link rel="manifest" href="{{ asset('build/manifest.webmanifest') }}">
    <meta name="theme-color" content="#f5f5f7">
    <script>
        window.apiBaseUrl = '{{ config('app.url') }}';
        
        // PWA Migration Fix: Clear old service workers for the new architecture (Vue Router + Tab Bar)
        const ARCH_VERSION = 'force_clear_v2_10_0';
        if (localStorage.getItem('pwa_arch_version') !== ARCH_VERSION) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                    localStorage.setItem('pwa_arch_version', ARCH_VERSION);
                    // Force clean reload to pick up new assets
                    window.location.reload(true);
                });
            } else {
                localStorage.setItem('pwa_arch_version', ARCH_VERSION);
            }
        }
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
