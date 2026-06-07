<?php

namespace Tests\Feature\Api;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LocalizationTest extends TestCase
{
    use RefreshDatabase;

    /**
     * A basic feature test example.
     */
    public function test_api_respects_x_locale_header(): void
    {
        $response = $this->getJson('/api/up', ['X-Locale' => 'ru']);
        $this->assertEquals('ru', app()->getLocale());

        $response = $this->getJson('/api/up', ['X-Locale' => 'en']);
        $this->assertEquals('en', app()->getLocale());
    }

    public function test_validation_messages_are_localized(): void
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Test RU
        $response = $this->postJson('/api/tasks', [], ['X-Locale' => 'ru']);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title']);
        $this->assertStringContainsString('обязательно для заполнения', $response->json('errors.title')[0]);

        // Test EN
        $response = $this->postJson('/api/tasks', [], ['X-Locale' => 'en']);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['title']);
        $this->assertStringContainsString('required', $response->json('errors.title')[0]);
    }
}
