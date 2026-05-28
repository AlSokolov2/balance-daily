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

    public function test_google_redirect_works(): void
    {
        $response = $this->get('/auth/google');
        $response->assertRedirect();
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
        
        $response->assertRedirect();
        $this->assertStringContainsString('token=', $response->getTargetUrl());
        
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor'
        ]);
    }

    public function test_dev_login_works_in_allowed_environments(): void
    {
        $response = $this->get('/auth/dev-login');

        $this->assertDatabaseHas('users', [
            'email' => 'alsokolov2@gmail.com'
        ]);

        $response->assertRedirect();
        $this->assertStringContainsString('token=', $response->getTargetUrl());

        $user = User::where('email', 'alsokolov2@gmail.com')->first();
        $this->assertDatabaseHas('categories', [
            'user_id' => $user->id,
            'slug' => 'chor'
        ]);
    }

    public function test_user_can_get_profile_when_authenticated(): void
    {
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
