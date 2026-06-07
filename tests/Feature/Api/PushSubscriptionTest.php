<?php

namespace Tests\Feature\Api;

use App\Models\PushSubscription;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PushSubscriptionTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_store_push_subscription(): void
    {
        $user = User::factory()->create();

        $data = [
            'endpoint' => 'https://fcm.googleapis.com/fcm/send/fake-token',
            'public_key' => 'BMA8A-fake-key',
            'auth_token' => 'fake-auth-secret',
        ];

        $response = $this->actingAs($user)->postJson('/api/push-subscriptions', $data);

        $response->assertStatus(200);
        $this->assertDatabaseHas('push_subscriptions', [
            'user_id' => $user->id,
        ]);

        // Check that it's retrievable (decrypted)
        $sub = PushSubscription::where('user_id', $user->id)->get()->first();
        $this->assertEquals($data['endpoint'], $sub->endpoint);
    }

    public function test_user_can_remove_push_subscription(): void
    {
        $user = User::factory()->create();
        $sub = $user->pushSubscriptions()->create([
            'endpoint' => 'https://example.com/endpoint',
            'public_key' => 'key',
            'auth_token' => 'auth',
        ]);

        $this->assertDatabaseCount('push_subscriptions', 1);

        $response = $this->actingAs($user)->deleteJson('/api/push-subscriptions', [
            'endpoint' => 'https://example.com/endpoint',
        ]);

        $response->assertStatus(204);
        $this->assertDatabaseCount('push_subscriptions', 0);
    }
}
