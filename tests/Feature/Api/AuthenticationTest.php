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

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');
        $response->assertRedirect();
        $this->assertStringContainsString('accounts.google.com', $response->getTargetUrl());
    }

    public function test_google_callback_creates_user_and_token(): void
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
            'google_id' => '123456789',
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

    public function test_dev_login_works_in_allowed_environments(): void
    {
        $response = $this->get('/auth/dev-login');

        $this->assertDatabaseHas('users', [
            'email' => 'alsokolov2@gmail.com',
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
