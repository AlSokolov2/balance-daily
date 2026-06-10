<?php

namespace Tests\Feature\Api;

use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TaskCompletionTest extends TestCase
{
    use RefreshDatabase;

    public function test_completion_records_history_and_reschedules_recurring_task()
    {
        $user = User::factory()->create();
        \App\Models\Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);
        
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
            'title' => 'Recurring Task',
            'repeat_type' => 'interval',
            'repeat_interval' => 1,
            'completed' => false,
        ]);

        $response = $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'completed' => true,
                'completed_at' => now()->toISOString(),
            ]);

        $response->assertStatus(200);
        
        // Assertions
        $task->refresh();
        
        // 1. Task should be marked as NOT completed (because it's recurring)
        $this->assertFalse($task->completed);
        
        // 2. hidden_until should be set (next occurrence)
        $this->assertNotNull($task->hidden_until);
        
        // 3. History should have 1 record
        $this->assertEquals(1, $task->completions()->count());
        
        // 4. last_completed_date should be updated
        $this->assertNotNull($task->last_completed_date);
    }

    public function test_completion_records_history_for_non_recurring_task()
    {
        $user = User::factory()->create();
        \App\Models\Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);

        $task = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
            'title' => 'One-time Task',
            'repeat_type' => 'none',
            'completed' => false,
        ]);

        $response = $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'completed' => true,
                'completed_at' => now()->toISOString(),
            ]);

        $response->assertStatus(200);
        
        $task->refresh();
        
        // 1. Task should remain completed
        $this->assertTrue($task->completed);
        
        // 2. History should have 1 record
        $this->assertEquals(1, $task->completions()->count());
    }

    public function test_offline_first_completion_with_was_completed_flag()
    {
        $user = User::factory()->create();
        \App\Models\Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);
        
        $task = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
            'repeat_type' => 'interval',
            'repeat_interval' => 1,
            'completed' => false,
        ]);

        // Simulating a client that already "reset" the task locally for tomorrow
        $response = $this->actingAs($user)
            ->putJson("/api/tasks/{$task->id}", [
                'completed' => false,
                '_was_completed' => true,
                'completed_at' => now()->toISOString(),
            ]);

        $response->assertStatus(200);
        
        $task->refresh();
        
        // History should be recorded despite 'completed' being false in request
        $this->assertEquals(1, $task->completions()->count());
        $this->assertNotNull($task->hidden_until);
    }
}
