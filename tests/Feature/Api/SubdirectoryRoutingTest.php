<?php

namespace Tests\Feature\Api;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\URL;
use Tests\TestCase;

class SubdirectoryRoutingTest extends TestCase
{
    public function test_asset_helper_generates_correct_urls_with_subdirectory(): void
    {
        // Use HTTP in test because URL::forceRootUrl doesn't automatically force HTTPS
        // unless you also call URL::forceScheme('https')
        Config::set('app.url', 'http://alekzander.info/daily');
        URL::forceRootUrl('http://alekzander.info/daily');

        $this->assertEquals(
            'http://alekzander.info/daily/favicon.svg',
            asset('favicon.svg')
        );
    }

    public function test_route_helper_respects_subdirectory(): void
    {
        Config::set('app.url', 'http://alekzander.info/custom-path');
        URL::forceRootUrl('http://alekzander.info/custom-path');

        $this->assertStringContainsString(
            'http://alekzander.info/custom-path/auth/google',
            url('/auth/google')
        );
    }

    public function test_api_routes_are_nested_correctly(): void
    {
        Config::set('app.url', 'http://site.com/deep/app');
        URL::forceRootUrl('http://site.com/deep/app');

        $this->assertEquals(
            'http://site.com/deep/app/api/tasks',
            url('/api/tasks')
        );
    }
}
