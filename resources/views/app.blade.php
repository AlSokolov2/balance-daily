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
        
        // V2.0.7 Cache Busting: Force unregister old Service Workers to fix MIME type errors
        if (!localStorage.getItem('v2_0_7_cache_busted')) {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.getRegistrations().then(function(registrations) {
                    for(let registration of registrations) {
                        registration.unregister();
                    }
                    localStorage.setItem('v2_0_7_cache_busted', 'true');
                    window.location.reload(true);
                });
            } else {
                localStorage.setItem('v2_0_7_cache_busted', 'true');
            }
        }
    </script>
    @vite(['resources/css/app.css', 'resources/js/app.js'])
</head>
<body>
    <div id="app"></div>
</body>
</html>
