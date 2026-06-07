<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskIsolationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_only_see_their_own_tasks(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $userA->id]);
        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $userB->id]);

        Task::create(['title' => 'Task A', 'category_slug' => 'chor', 'importance' => 2, 'user_id' => $userA->id]);
        Task::create(['title' => 'Task B', 'category_slug' => 'chor', 'importance' => 2, 'user_id' => $userB->id]);

        $response = $this->actingAs($userA)->getJson('/api/tasks');

        $response->assertStatus(200)
            ->assertJsonCount(1)
            ->assertJsonPath('0.title', 'Task A');
    }

    public function test_user_cannot_access_other_users_task_by_id(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $userB->id]);
        $taskB = Task::create(['title' => 'Task B', 'category_slug' => 'chor', 'importance' => 2, 'user_id' => $userB->id]);

        $response = $this->actingAs($userA)->getJson('/api/tasks/'.$taskB->id);

        $response->assertStatus(404);
    }

    public function test_user_cannot_delete_other_users_task(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $userB->id]);
        $taskB = Task::create(['title' => 'Task B', 'category_slug' => 'chor', 'importance' => 2, 'user_id' => $userB->id]);

        $response = $this->actingAs($userA)->deleteJson('/api/tasks/'.$taskB->id);

        $response->assertStatus(404);
        $this->assertDatabaseHas('tasks', ['id' => $taskB->id]);
    }

    public function test_user_can_create_task_with_category_slug_clash(): void
    {
        $userA = User::factory()->create();
        $userB = User::factory()->create();

        Category::create(['slug' => 'work', 'name' => 'Work A', 'weight' => 0.1, 'user_id' => $userA->id]);
        Category::create(['slug' => 'work', 'name' => 'Work B', 'weight' => 0.1, 'user_id' => $userB->id]);

        $response = $this->actingAs($userA)->postJson('/api/tasks', [
            'title' => 'My Task',
            'category_slug' => 'work',
            'importance' => 3,
        ]);

        $response->assertStatus(201);

        $task = Task::where('user_id', $userA->id)->where('category_slug', 'work')->first();
        $this->assertEquals('My Task', $task->title);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'user_id' => $userA->id,
            'category_slug' => 'work',
        ]);
    }
}
