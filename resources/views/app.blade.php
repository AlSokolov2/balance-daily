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
        window.assetBaseUrl = '{{ asset('build') }}/';
        
        // V2.1.3 PWA Fix: Force unregister old Service Workers to resolve scope conflicts
        if (!localStorage.getItem('v2_1_3_pwa_fix')) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                    localStorage.setItem('v2_1_3_pwa_fix', 'true');
                    window.location.reload(true);
                });
            } else {
                localStorage.setItem('v2_1_3_pwa_fix', 'true');
            }
        }
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
