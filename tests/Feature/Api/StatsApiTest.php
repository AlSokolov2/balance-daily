<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\TaskCompletion;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class StatsApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_get_stats()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Ensure category exists for SAME USER (composite FK)
        Category::factory()->create([
            'slug' => 'work',
            'user_id' => $user->id,
        ]);

        $task = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
        ]);

        // Create completions
        TaskCompletion::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'completed_at' => Carbon::today(),
        ]);
        TaskCompletion::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'completed_at' => Carbon::yesterday(),
        ]);

        $response = $this->getJson('/api/stats');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'heatmap',
                'category_balance',
                'counters' => [
                    'today',
                    'total',
                    'current_streak',
                    'longest_streak',
                ],
            ]);

        $this->assertEquals(1, $response->json('counters.today'));
        $this->assertEquals(2, $response->json('counters.total'));
        $this->assertEquals(2, $response->json('counters.current_streak'));
    }

    public function test_stats_isolation()
    {
        $user1 = User::factory()->create();
        $user2 = User::factory()->create();

        Category::factory()->create(['slug' => 'chor', 'user_id' => $user1->id]);
        Category::factory()->create(['slug' => 'chor', 'user_id' => $user2->id]);

        $task1 = Task::factory()->create(['user_id' => $user1->id, 'category_slug' => 'chor']);
        $task2 = Task::factory()->create(['user_id' => $user2->id, 'category_slug' => 'chor']);

        TaskCompletion::create([
            'task_id' => $task1->id,
            'user_id' => $user1->id,
            'completed_at' => Carbon::now(),
        ]);

        $this->actingAs($user2);
        $response = $this->getJson('/api/stats');

        $response->assertStatus(200);
        $this->assertEquals(0, $response->json('counters.total'));
    }

    public function test_streak_calculation()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Category::factory()->create(['slug' => 'chor', 'user_id' => $user->id]);
        $task = Task::factory()->create(['user_id' => $user->id, 'category_slug' => 'chor']);

        // Create 3 day streak
        TaskCompletion::create(['task_id' => $task->id, 'user_id' => $user->id, 'completed_at' => Carbon::today()]);
        TaskCompletion::create(['task_id' => $task->id, 'user_id' => $user->id, 'completed_at' => Carbon::yesterday()]);
        TaskCompletion::create(['task_id' => $task->id, 'user_id' => $user->id, 'completed_at' => Carbon::today()->subDays(2)]);

        $response = $this->getJson('/api/stats');
        if ($response->json('counters.current_streak') !== 3) {
            fwrite(STDERR, print_r($response->json(), true));
        }
        $this->assertEquals(3, $response->json('counters.current_streak'));
        $this->assertEquals(3, $response->json('counters.longest_streak'));

        // Break streak (gap at subDays(3))
        TaskCompletion::create(['task_id' => $task->id, 'user_id' => $user->id, 'completed_at' => Carbon::today()->subDays(4)]);

        $response = $this->getJson('/api/stats');
        if ($response->json('counters.current_streak') !== 3) {
            fwrite(STDERR, print_r($response->json(), true));
        }
        $this->assertEquals(3, $response->json('counters.current_streak'));
        $this->assertEquals(3, $response->json('counters.longest_streak'));

        // Clear and check yesterday only
        TaskCompletion::query()->delete();
        TaskCompletion::create(['task_id' => $task->id, 'user_id' => $user->id, 'completed_at' => Carbon::yesterday()]);

        $response = $this->getJson('/api/stats');
        $this->assertEquals(1, $response->json('counters.current_streak'));
    }
}
