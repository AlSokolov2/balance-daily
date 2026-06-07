<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RecurringTaskTest extends TestCase
{
    use RefreshDatabase;

    public function test_recurring_task_preserves_hidden_until_field(): void
    {
        $user = User::factory()->create();
        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $user->id]);

        $task = Task::create([
            'title' => 'Recurring Task',
            'category_slug' => 'chor',
            'importance' => 2,
            'user_id' => $user->id,
            'repeat_type' => 'interval',
            'repeat_interval' => 2,
        ]);

        $nextDate = now()->addDays(2)->toDateTimeString();

        $response = $this->actingAs($user)->putJson('/api/tasks/'.$task->id, [
            'hidden_until' => $nextDate,
            'last_completed_date' => now()->toDateTimeString(),
            'notes' => 'Some notes',
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('tasks', [
            'id' => $task->id,
            'hidden_until' => $nextDate,
        ]);

        $updatedTask = Task::find($task->id);
        $this->assertEquals($nextDate, $updatedTask->hidden_until->toDateTimeString());
    }

    public function test_creating_task_with_hidden_until(): void
    {
        $user = User::factory()->create();
        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.1, 'user_id' => $user->id]);

        $futureDate = now()->addDays(5)->toDateTimeString();

        $response = $this->actingAs($user)->postJson('/api/tasks', [
            'title' => 'New Task',
            'category_slug' => 'chor',
            'importance' => 1,
            'hidden_until' => $futureDate,
        ]);

        $response->assertStatus(201);

        // Assert on non-encrypted fields
        $this->assertDatabaseHas('tasks', [
            'category_slug' => 'chor',
            'hidden_until' => $futureDate,
        ]);

        // Verify title manually (it will be decrypted by the model)
        $task = Task::where('user_id', $user->id)->first();
        $this->assertEquals('New Task', $task->title);
    }
}
