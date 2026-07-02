<?php

namespace Tests\Feature\Api;

use App\Models\AuthCode;
use App\Models\User;
use App\Models\UserProvider;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    // ────────────────────────────────────────────
    //  VK ID OAuth (new default provider)
    // ────────────────────────────────────────────

    public function test_vkid_redirect_works(): void
    {
        $response = $this->get('/auth/vkid');
        $response->assertRedirect();
        $this->assertStringContainsString('id.vk.ru', $response->getTargetUrl());
    }

    /** New user: creates user + user_provider record */
    public function test_vkid_callback_creates_user(): void
    {
        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('987654321');
        $abstractUser->shouldReceive('getName')->andReturn('VK User');
        $abstractUser->shouldReceive('getEmail')->andReturn('vkuser@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://vk.com/ava.jpg');
        $abstractUser->token = 'vk-fake-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('vkid')->andReturn($provider);

        $response = $this->get('/auth/vkid/callback');

        $this->assertDatabaseHas('users', [
            'email' => 'vkuser@example.com',
        ]);

        /** @var User $user */
        $user = User::where('email', 'vkuser@example.com')->first();

        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'vkid',
            'provider_id' => '987654321',
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor',
        ]);
    }

    /**
     * Auto-link by email: existing Google user authenticates via VK
     * with the same email → VK provider added to existing user.
     */
    public function test_vkid_callback_links_by_email_to_existing_user(): void
    {
        $user = User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
        ]);
        $user->providers()->create([
            'provider' => 'google',
            'provider_id' => 'google-old-id',
        ]);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('vk-new-id');
        $abstractUser->shouldReceive('getName')->andReturn('Existing User');
        $abstractUser->shouldReceive('getEmail')->andReturn('existing@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://vk.com/ava.jpg');
        $abstractUser->token = 'vk-fake-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('vkid')->andReturn($provider);

        $this->get('/auth/vkid/callback');

        // Should still be one user
        $this->assertDatabaseCount('users', 1);

        // Now has both Google and VK providers
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_id' => 'google-old-id',
        ]);
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'vkid',
            'provider_id' => 'vk-new-id',
        ]);
    }

    /** Returning VK user: found directly by provider+provider_id */
    public function test_vkid_callback_finds_existing_vkid_user_directly(): void
    {
        $user = User::create([
            'name' => 'VK Return User',
            'email' => 'returning@example.com',
        ]);
        $user->providers()->create([
            'provider' => 'vkid',
            'provider_id' => 'vk-existing-id',
        ]);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('vk-existing-id');
        $abstractUser->shouldReceive('getName')->andReturn('VK Return User');
        $abstractUser->shouldReceive('getEmail')->andReturn('returning@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://vk.com/ava.jpg');
        $abstractUser->token = 'vk-fake-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('vkid')->andReturn($provider);

        $this->get('/auth/vkid/callback');

        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseCount('user_providers', 1);
    }

    // ────────────────────────────────────────────
    //  Manual linking (from Settings)
    // ────────────────────────────────────────────

    public function test_link_token_requires_auth(): void
    {
        $response = $this->postJson('/api/auth/link-token');
        $response->assertStatus(401);
    }

    public function test_link_token_returns_url(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        // Default provider (vkid)
        $response = $this->actingAs($user)->postJson('/api/auth/link-token');
        $response->assertStatus(200)->assertJsonStructure(['url']);
        $this->assertStringContainsString('/auth/vkid/link?token=', $response->json('url'));

        // Explicit provider
        $response = $this->actingAs($user)->postJson('/api/auth/link-token', ['provider' => 'google']);
        $this->assertStringContainsString('/auth/google/link?token=', $response->json('url'));
    }

    public function test_vkid_callback_links_provider_via_session_intent(): void
    {
        $user = User::create([
            'name' => 'Settings Linker',
            'email' => 'old-email@example.com',
        ]);

        // Simulate linkRedirect: store intent in session
        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('vk-linked-id');
        $abstractUser->shouldReceive('getName')->andReturn('Settings Linker');
        $abstractUser->shouldReceive('getEmail')->andReturn('new-vk-email@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://vk.com/ava.jpg');
        $abstractUser->token = 'vk-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('vkid')->andReturn($provider);

        $response = $this->withSession([
            'oauth_link_user_id' => $user->id,
            'oauth_link_driver' => 'vkid',
        ])->get('/auth/vkid/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        // Provider linked to existing user
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'vkid',
            'provider_id' => 'vk-linked-id',
        ]);

        // VK email became primary
        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'email' => 'new-vk-email@example.com',
        ]);
    }

    /**
     * When linking and the provider identity belongs to another user,
     * the current user is merged into the data owner (the existing user).
     * The empty current user is deleted, all data transferred.
     */
    public function test_vkid_callback_link_merges_when_provider_already_linked_to_other(): void
    {
        // Data owner: old Google user with tasks
        $dataOwner = User::create(['name' => 'Data Owner', 'email' => 'owner@example.com']);
        $dataOwner->providers()->create(['provider' => 'google', 'provider_id' => 'shared-id']);
        $dataOwner->categories()->create(['slug' => 'custom', 'name' => 'Custom', 'weight' => 0.1, 'color' => '#fff']);
        $dataOwner->tasks()->create(['title' => 'Important task', 'category_slug' => 'custom', 'importance' => 2]);

        // Current user: new VK user trying to link Google
        $currentUser = User::create(['name' => 'VK User', 'email' => 'new@vk.com']);
        $currentUser->providers()->create(['provider' => 'vkid', 'provider_id' => 'vk-1']);

        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('shared-id');
        $abstractUser->shouldReceive('getName')->andReturn('VK User');
        $abstractUser->shouldReceive('getEmail')->andReturn('merged@vk.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('');
        $abstractUser->token = 'tok';

        $provider = Mockery::mock('Laravel\Socialite\Two\AbstractProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->withSession([
            'oauth_link_user_id' => $currentUser->id,
            'oauth_link_driver' => 'google',
        ])->get('/auth/google/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        // Current user should be deleted (merged into data owner)
        $this->assertDatabaseMissing('users', ['id' => $currentUser->id]);

        // Data owner now has VK provider and merged data
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $dataOwner->id,
            'provider' => 'vkid',
            'provider_id' => 'vk-1',
        ]);
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $dataOwner->id,
            'provider' => 'google',
            'provider_id' => 'shared-id',
        ]);

        // Task and category transferred to data owner
        $this->assertEquals(1, $dataOwner->tasks()->count());
        $this->assertEquals(1, $dataOwner->categories()->where('slug', 'custom')->count());

        // Email updated to linked provider's email
        $this->assertDatabaseHas('users', [
            'id' => $dataOwner->id,
            'email' => 'merged@vk.com',
        ]);
    }

    public function test_link_redirect_missing_token(): void
    {
        $response = $this->get('/auth/vkid/link');
        $response->assertRedirect();
        $this->assertStringContainsString('error=missing_token', $response->getTargetUrl());
    }

    public function test_link_redirect_invalid_token(): void
    {
        $response = $this->get('/auth/vkid/link?token=nonexistent');
        $response->assertRedirect();
        $this->assertStringContainsString('error=invalid_or_expired_token', $response->getTargetUrl());
    }

    public function test_link_redirect_expired_token(): void
    {
        // Manually set an already-expired cache entry
        cache(['auth_link_expired_token' => 1], 0);

        $response = $this->get('/auth/vkid/link?token=expired_token');
        $response->assertRedirect();
        $this->assertStringContainsString('error=invalid_or_expired_token', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Google OAuth (backward compatibility)
    // ────────────────────────────────────────────

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');
        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->getTargetUrl());
    }

    public function test_google_callback_creates_user(): void
    {
        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->shouldReceive('getId')->andReturn('123456789');
        $abstractUser->shouldReceive('getName')->andReturn('Test User');
        $abstractUser->shouldReceive('getEmail')->andReturn('test@example.com');
        $abstractUser->shouldReceive('getAvatar')->andReturn('https://avatar.com/123');
        $abstractUser->token = 'fake-token';
        $abstractUser->refreshToken = 'fake-refresh-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/auth/google/callback');

        $this->assertDatabaseHas('users', ['email' => 'test@example.com']);
        $user = User::where('email', 'test@example.com')->first();

        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'google',
            'provider_id' => '123456789',
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Code exchange (unchanged)
    // ────────────────────────────────────────────

    public function test_code_exchange_returns_token(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $plainCode = bin2hex(random_bytes(32));
        AuthCode::create([
            'user_id' => $user->id,
            'code' => hash('sha256', $plainCode),
            'expires_at' => now()->addSeconds(60),
        ]);

        $response = $this->postJson('/api/auth/exchange-code', ['code' => $plainCode]);

        $response->assertStatus(200)->assertJsonStructure(['token']);

        $secondResponse = $this->postJson('/api/auth/exchange-code', ['code' => $plainCode]);
        $secondResponse->assertStatus(422);
    }

    public function test_code_exchange_rejects_expired_code(): void
    {
        /** @var User $user */
        $user = User::factory()->create();

        $plainCode = bin2hex(random_bytes(32));
        AuthCode::create([
            'user_id' => $user->id,
            'code' => hash('sha256', $plainCode),
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->postJson('/api/auth/exchange-code', ['code' => $plainCode]);
        $response->assertStatus(422);
    }

    public function test_code_exchange_is_rate_limited(): void
    {
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/auth/exchange-code', ['code' => 'any']);
        }

        $response = $this->postJson('/api/auth/exchange-code', ['code' => 'any']);
        $response->assertStatus(429);
    }

    // ────────────────────────────────────────────
    //  Dev login
    // ────────────────────────────────────────────

    public function test_dev_login_works_in_allowed_environments(): void
    {
        $response = $this->get('/auth/dev-login');

        $this->assertDatabaseHas('users', ['email' => 'alsokolov2@gmail.com']);

        /** @var User $user */
        $user = User::where('email', 'alsokolov2@gmail.com')->first();
        $this->assertDatabaseHas('user_providers', [
            'user_id' => $user->id,
            'provider' => 'dev',
        ]);
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor',
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Error handling
    // ────────────────────────────────────────────

    public function test_vkid_callback_handles_invalid_state(): void
    {
        Socialite::shouldReceive('driver')->with('vkid')
            ->andThrow(new \Laravel\Socialite\Two\InvalidStateException);

        $response = $this->get('/auth/vkid/callback');
        $response->assertRedirect();
        $this->assertStringContainsString('error=state_invalid', $response->getTargetUrl());
    }

    public function test_vkid_callback_handles_client_exception(): void
    {
        $mockResponse = new \GuzzleHttp\Psr7\Response(401);
        Socialite::shouldReceive('driver')->with('vkid')
            ->andThrow(new \GuzzleHttp\Exception\ClientException(
                'access denied',
                new \GuzzleHttp\Psr7\Request('GET', 'test'),
                $mockResponse
            ));

        $response = $this->get('/auth/vkid/callback');
        $response->assertRedirect();
        $this->assertStringContainsString('error=access_denied', $response->getTargetUrl());
    }

    public function test_vkid_callback_handles_generic_exception(): void
    {
        Socialite::shouldReceive('driver')->with('vkid')
            ->andThrow(new \RuntimeException('Unknown error'));

        $response = $this->get('/auth/vkid/callback');
        $response->assertRedirect();
        $this->assertStringContainsString('error=auth_failed', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Profile / guards
    // ────────────────────────────────────────────

    public function test_user_can_get_profile_when_authenticated(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200)->assertJson(['email' => $user->email]);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }
}
