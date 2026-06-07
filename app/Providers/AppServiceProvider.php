<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Task;
use App\Observers\SyncObserver;
use Illuminate\Support\Facades\URL;
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
        Task::observe(SyncObserver::class);
        Category::observe(SyncObserver::class);

        if (config('app.url')) {
            $url = config('app.url');
            URL::forceRootUrl($url);
            if (str_starts_with($url, 'https')) {
                URL::forceScheme('https');
            }

            $root = parse_url($url, PHP_URL_PATH);
            if ($root && $root !== '/') {
                // Всегда форсируем SCRIPT_NAME, если мы в подпапке
                request()->server->set('SCRIPT_NAME', $root.'/index.php');
            }
        }
    }
}
