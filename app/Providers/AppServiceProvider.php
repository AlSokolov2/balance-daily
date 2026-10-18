<?php

namespace App\Providers;

use App\Models\Category;
use App\Models\Task;
use App\Observers\SyncObserver;
use Illuminate\Cache\RateLimiting\Limit;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\RateLimiter;
use Illuminate\Support\Facades\URL;
use Illuminate\Support\ServiceProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;
use SocialiteProviders\VKID\Provider as VKIDProvider;

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
        // Safety: force debug off in production regardless of .env
        if (app()->environment('production') && config('app.debug')) {
            config(['app.debug' => false]);
        }

        // Named limiters so the ceilings can be raised in test environments without
        // touching the routes. The e2e suite would otherwise exhaust both.
        RateLimiter::for('exchange-code', function (Request $request): Limit {
            return Limit::perMinute((int) config('rate_limits.exchange_code'))
                ->by($request->ip());
        });

        // Keyed the way the framework keys a bare `throttle:60,1`: per user when
        // authenticated, per IP otherwise.
        RateLimiter::for('api', function (Request $request): Limit {
            return Limit::perMinute((int) config('rate_limits.api'))
                ->by($request->user()?->getAuthIdentifier() ?? $request->ip());
        });

        Task::observe(SyncObserver::class);
        Category::observe(SyncObserver::class);

        Event::listen(function (SocialiteWasCalled $event) {
            $event->extendSocialite('vkid', VKIDProvider::class);
        });

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
