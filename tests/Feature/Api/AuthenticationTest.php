<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Tests\TestCase;

class AuthenticationTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->withoutVite();
    }

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');
        
        // Assert redirect to google
        $this->assertStringContainsString('accounts.google.com', $response->getTargetUrl());
    }

    public function test_google_callback_creates_user_and_token(): void
    {
        $abstractUser = Mockery::mock('Laravel\Socialite\Two\User');
        $abstractUser->id = '123456789';
        $abstractUser->name = 'Test User';
        $abstractUser->email = 'test@example.com';
        $abstractUser->avatar = 'https://avatar.com/123';
        $abstractUser->token = 'fake-token';
        $abstractUser->refreshToken = 'fake-refresh-token';

        $provider = Mockery::mock('Laravel\Socialite\Two\GoogleProvider');
        $provider->shouldReceive('user')->andReturn($abstractUser);

        Socialite::shouldReceive('driver')->with('google')->andReturn($provider);

        $response = $this->get('/auth/google/callback');

        $this->assertDatabaseHas('users', [
            'email' => 'test@example.com',
            'google_id' => '123456789'
        ]);

        $user = User::where('email', 'test@example.com')->first();
        
        // Assert token is present in redirect URL
        $this->assertStringContainsString('token=', $response->getTargetUrl());
        
        // Assert default categories were seeded
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor'
        ]);
    }

    public function test_user_can_get_their_profile_when_authenticated(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test')->plainTextToken;

        $response = $this->getJson('/api/user', [
            'Authorization' => 'Bearer ' . $token
        ]);

        $response->assertStatus(200)
                 ->assertJsonPath('email', $user->email);
    }

    public function test_unauthenticated_user_cannot_access_protected_routes(): void
    {
        $response = $this->getJson('/api/user');
        $response->assertStatus(401);
    }
}
