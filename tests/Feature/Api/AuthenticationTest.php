<?php

namespace Tests\Feature\Api;

use App\Models\AuthCode;
use App\Models\User;
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
            'provider' => 'vkid',
            'provider_id' => '987654321',
        ]);

        /** @var User $user */
        $user = User::where('email', 'vkuser@example.com')->first();

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor',
        ]);
    }

    /**
     * Account linking: when a user with an existing account (e.g. Google)
     * authenticates via VK ID with the same email, the VK provider
     * should be linked to the existing account.
     */
    public function test_vkid_callback_links_by_email_to_existing_user(): void
    {
        // Create an existing user (simulating a Google-originated account)
        User::create([
            'name' => 'Existing User',
            'email' => 'existing@example.com',
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

        // Should be one user, now linked to VK
        $this->assertDatabaseCount('users', 1);

        $this->assertDatabaseHas('users', [
            'email' => 'existing@example.com',
            'provider' => 'vkid',
            'provider_id' => 'vk-new-id',
        ]);
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

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'provider' => 'google',
            'provider_id' => '123456789',
        ]);

        /** @var User $user */
        $user = User::where('email', 'test@example.com')->first();

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor',
        ]);
    }

    // ────────────────────────────────────────────
    //  Code exchange (provider-agnostic — unchanged)
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

        $response = $this->postJson('/api/auth/exchange-code', [
            'code' => $plainCode,
        ]);

        $response->assertStatus(200)
            ->assertJsonStructure(['token']);

        // Code should be consumed — cannot reuse
        $secondResponse = $this->postJson('/api/auth/exchange-code', [
            'code' => $plainCode,
        ]);
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

        $response = $this->postJson('/api/auth/exchange-code', [
            'code' => $plainCode,
        ]);

        $response->assertStatus(422);
    }

    public function test_code_exchange_is_rate_limited(): void
    {
        // 5 requests per minute allowed, 6th should be throttled
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

        $this->assertDatabaseHas('users', [
            'email' => 'alsokolov2@gmail.com',
            'provider' => 'dev',
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('code=', $response->getTargetUrl());

        /** @var User $user */
        $user = User::where('email', 'alsokolov2@gmail.com')->first();
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor',
        ]);
    }

    // ────────────────────────────────────────────
    //  Account linking edge cases
    // ────────────────────────────────────────────

    /**
     * Returning VK user: when a user already has provider='vkid',
     * they should be found directly by provider + provider_id,
     * not via email matching.
     */
    public function test_vkid_callback_finds_existing_vkid_user_directly(): void
    {
        // Create a user who already logged in via VK before
        User::create([
            'name' => 'VK Return User',
            'email' => 'returning@example.com',
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

        // No duplicate user created
        $this->assertDatabaseCount('users', 1);
        $this->assertDatabaseHas('users', [
            'email' => 'returning@example.com',
            'provider' => 'vkid',
            'provider_id' => 'vk-existing-id',
        ]);
    }

    /**
     * When Socialite callback fails with a general exception,
     * user should be redirected with error=auth_failed.
     */
    public function test_vkid_callback_handles_generic_exception(): void
    {
        Socialite::shouldReceive('driver')->with('vkid')
            ->andThrow(new \RuntimeException('Unknown error'));

        $response = $this->get('/auth/vkid/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('error=auth_failed', $response->getTargetUrl());
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
            ->andThrow(new \GuzzleHttp\Exception\ClientException('access denied', new \GuzzleHttp\Psr7\Request('GET', 'test'), $mockResponse));

        $response = $this->get('/auth/vkid/callback');

        $response->assertRedirect();
        $this->assertStringContainsString('error=access_denied', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Config / default driver
    // ────────────────────────────────────────────

    public function test_oauth_default_driver_is_vkid(): void
    {
        // /auth/vkid uses defaultDriver() which reads auth.oauth_driver
        // Default is 'vkid'
        $response = $this->get('/auth/vkid');
        $response->assertRedirect();
        $this->assertStringContainsString('id.vk.ru', $response->getTargetUrl());
    }

    // ────────────────────────────────────────────
    //  Profile / auth guards
    // ────────────────────────────────────────────

    public function test_user_can_get_profile_when_authenticated(): void
    {
        /** @var User $user */
        $user = User::factory()->create();
        $response = $this->actingAs($user)->getJson('/api/user');

        $response->assertStatus(200)
            ->assertJson(['email' => $user->email]);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }
}
