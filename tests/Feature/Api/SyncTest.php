<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SyncTest extends TestCase
{
    use RefreshDatabase;

    public function test_full_sync_returns_all_data(): void
    {
        $user = User::factory()->create();
        Category::factory()->create(['user_id' => $user->id, 'slug' => 'cat1']);
        Task::factory()->count(3)->create(['user_id' => $user->id, 'category_slug' => 'cat1']);

        $response = $this->actingAs($user)->getJson('/api/sync');

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'categories.updated');
        $response->assertJsonCount(3, 'tasks.updated');
        $response->assertJsonStructure(['server_time', 'settings', 'subcatCoeffs']);
    }

    public function test_incremental_sync_returns_only_new_changes(): void
    {
        $user = User::factory()->create();
        $cat = Category::factory()->create(['user_id' => $user->id, 'slug' => 'cat1']);

        $since = now()->subMinute();

        // Old task (not in sync)
        $oldTask = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'cat1',
            'created_at' => now()->subMinutes(5),
            'updated_at' => now()->subMinutes(5),
        ]);

        // New task
        $newTask = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'cat1',
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        $response = $this->actingAs($user)->getJson('/api/sync?since='.$since->toISOString());

        $response->assertStatus(200);
        $response->assertJsonCount(1, 'tasks.updated');
        $this->assertEquals($newTask->id, $response->json('tasks.updated.0.id'));
    }

    public function test_sync_tracks_deleted_items(): void
    {
        $user = User::factory()->create();
        $cat = Category::factory()->create(['user_id' => $user->id, 'slug' => 'cat1']);
        $task = Task::factory()->create(['user_id' => $user->id, 'category_slug' => 'cat1']);

        $since = now();

        // Ensure time moves forward for deletion log
        Carbon::setTestNow(now()->addMinute());

        // Delete the task
        $task->delete();

        $response = $this->actingAs($user)->getJson('/api/sync?since='.$since->toISOString());

        $response->assertStatus(200);
        $this->assertContains($task->id, $response->json('tasks.deleted'));

        Carbon::setTestNow(); // Reset time
    }
}
