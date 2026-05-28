<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Setting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SettingsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_settings(): void
    {
        $user = User::factory()->create();
        Setting::create(['key' => 'test_key', 'value' => 'test_value', 'user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/settings');

        $response->assertStatus(200)
                 ->assertJson(['test_key' => 'test_value']);
    }

    public function test_user_can_update_settings(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/settings', [
            'settings' => [
                'notepad_text' => 'Updated Text',
                'theme' => 'dark'
            ]
        ]);

        $response->assertStatus(200)
                 ->assertJson(['notepad_text' => 'Updated Text', 'theme' => 'dark']);
        
        $this->assertEquals('Updated Text', Setting::where('key', 'notepad_text')->where('user_id', $user->id)->first()->value);
        $this->assertDatabaseHas('settings', [
            'key' => 'notepad_text',
            'user_id' => $user->id
        ]);
    }

    public function test_user_cannot_see_others_settings(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();
        Setting::create(['key' => 'secret', 'value' => 'private', 'user_id' => $userB->id]);

        $response = $this->actingAs($userA)->getJson('/api/settings');

        $response->assertStatus(200)
                 ->assertJsonMissing(['secret' => 'private']);
    }

    public function test_user_automatically_resets_date_on_new_day(): void
    {
        $user = User::factory()->create(['last_reset_date' => '2020-01-01']);
        
        // Fetch settings - this should trigger the auto-reset logic for 'today'
        $response = $this->actingAs($user)->getJson('/api/settings');
        
        $response->assertStatus(200);
        
        $user->refresh();
        $this->assertEquals(now()->toDateString(), $user->last_reset_date);
    }
}
