<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();
        $this->user = User::factory()->create();
        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $this->user->id]);
    }

    public function test_create_task_with_urgency(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Urgent task',
            'category_slug' => 'chor',
            'importance' => 3,
            'urgency' => 'urgent',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tasks', [
            'id' => $response->json('id'),
            'urgency' => 'urgent',
        ]);
    }

    public function test_create_task_with_scheduled_date(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Scheduled task',
            'category_slug' => 'chor',
            'importance' => 2,
            'scheduled_date' => '2026-12-25',
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tasks', [
            'id' => $response->json('id'),
            'scheduled_date' => '2026-12-25',
        ]);
    }

    public function test_urgency_defaults_to_not_urgent(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Default urgency',
            'category_slug' => 'chor',
            'importance' => 2,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tasks', [
            'id' => $response->json('id'),
            'urgency' => 'not_urgent',
        ]);
    }

    public function test_scheduled_date_defaults_to_null(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'No schedule',
            'category_slug' => 'chor',
            'importance' => 2,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('tasks', [
            'id' => $response->json('id'),
            'scheduled_date' => null,
        ]);
    }

    public function test_update_task_urgency(): void
    {
        $task = Task::create([
            'title' => 'Update me',
            'category_slug' => 'chor',
            'importance' => 2,
            'urgency' => 'not_urgent',
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->putJson('/api/tasks/'.$task->id, [
            'urgency' => 'urgent',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'urgency' => 'urgent',
        ]);
    }

    public function test_update_task_scheduled_date(): void
    {
        $task = Task::create([
            'title' => 'Schedule update',
            'category_slug' => 'chor',
            'importance' => 2,
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->putJson('/api/tasks/'.$task->id, [
            'scheduled_date' => '2026-06-15',
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'scheduled_date' => '2026-06-15',
        ]);
    }

    public function test_scheduled_date_can_be_cleared(): void
    {
        $task = Task::create([
            'title' => 'Clear schedule',
            'category_slug' => 'chor',
            'importance' => 2,
            'scheduled_date' => '2026-06-15',
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->putJson('/api/tasks/'.$task->id, [
            'scheduled_date' => null,
        ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'scheduled_date' => null,
        ]);
    }

    public function test_new_fields_present_in_sync_response(): void
    {
        Task::create([
            'title' => 'Sync test',
            'category_slug' => 'chor',
            'importance' => 2,
            'urgency' => 'urgent',
            'scheduled_date' => '2026-12-25',
            'user_id' => $this->user->id,
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/sync');

        $response->assertStatus(200);
        $task = $response->json('tasks.updated.0');
        $this->assertEquals('urgent', $task['urgency']);
        $this->assertEquals('2026-12-25', $task['scheduled_date']);
    }

    public function test_validation_rejects_invalid_urgency(): void
    {
        $response = $this->actingAs($this->user)->postJson('/api/tasks', [
            'title' => 'Bad urgency',
            'category_slug' => 'chor',
            'importance' => 2,
            'urgency' => 'invalid_value',
        ]);

        $response->assertStatus(422);
    }

    public function test_validation_accepts_valid_urgency_values(): void
    {
        foreach (['urgent', 'not_urgent'] as $value) {
            $response = $this->actingAs($this->user)->postJson('/api/tasks', [
                'title' => "Urgency: $value",
                'category_slug' => 'chor',
                'importance' => 2,
                'urgency' => $value,
            ]);
            $response->assertStatus(201);
        }
    }
}
