<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        //
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (config('app.url')) {
            $url = config('app.url');
            \Illuminate\Support\Facades\URL::forceRootUrl($url);
            if (str_starts_with($url, 'https')) {
                \Illuminate\Support\Facades\URL::forceScheme('https');
            }
            
            $root = parse_url($url, PHP_URL_PATH);
            if ($root && $root !== '/') {
                // Коррекция для Apache: убираем префикс подпапки из внутреннего пути
                $path = request()->getBasePath();
                if (!str_contains($path, $root)) {
                    request()->server->set('SCRIPT_NAME', $root . '/index.php');
                }
            }
        }
    }
}
