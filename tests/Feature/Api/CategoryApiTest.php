<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CategoryApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_list_categories(): void
    {
        $user = User::factory()->create();
        Category::create(['slug' => 'test', 'name' => 'Test', 'weight' => 0.5, 'user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/categories');

        $response->assertStatus(200)
                 ->assertJsonCount(1)
                 ->assertJsonPath('0.slug', 'test');
    }

    public function test_user_can_create_category(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->postJson('/api/categories', [
            'slug' => 'work',
            'name' => 'Work',
            'weight' => 0.6,
            'color' => '#ffffff'
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('categories', [
            'slug' => 'work',
            'user_id' => $user->id
        ]);
    }

    public function test_user_can_update_category(): void
    {
        $user = User::factory()->create();
        $cat = Category::create(['slug' => 'work', 'name' => 'Work', 'weight' => 0.1, 'user_id' => $user->id]);

        $response = $this->actingAs($user)->putJson('/api/categories/' . $cat->id, [
            'name' => 'New Name'
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('categories', [
            'id' => $cat->id,
            'name' => 'New Name'
        ]);
    }

    public function test_user_can_delete_category(): void
    {
        $user = User::factory()->create();
        $cat = Category::create(['slug' => 'work', 'name' => 'Work', 'weight' => 0.1, 'user_id' => $user->id]);

        $response = $this->actingAs($user)->deleteJson('/api/categories/' . $cat->id);

        $response->assertStatus(204);
        $this->assertDatabaseMissing('categories', ['id' => $cat->id]);
    }
}
