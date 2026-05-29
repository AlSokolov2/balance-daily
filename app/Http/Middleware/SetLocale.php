<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class SetLocale
{
    /**
     * Handle an incoming request.
     *
     * @param  Closure(Request): (Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $locale = $request->header('X-Locale');

        if (!$locale) {
            $locale = $request->getPreferredLanguage(['en', 'ru']);
        }

        if (in_array($locale, ['en', 'ru'])) {
            app()->setLocale($locale);
        }

        return $next($request);
    }
}
