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
                'status' => [
                    'active_tasks',
                    'overdue_tasks',
                    'postponed_tasks',
                    'hidden_tasks',
                    'completed_today',
                    'completion_rate',
                    'categories_health',
                ],
            ]);

        $this->assertEquals(1, $response->json('counters.today'));
        $this->assertEquals(2, $response->json('counters.total'));
        $this->assertEquals(2, $response->json('counters.current_streak'));

        // System status assertions
        $this->assertEquals(1, $response->json('status.active_tasks'));
        $this->assertEquals(0, $response->json('status.overdue_tasks'));
        $this->assertEquals(1, $response->json('status.completed_today'));
        $this->assertArrayHasKey('work', $response->json('status.categories_health'));
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

    public function test_category_balance_includes_all_categories_even_with_zero_completions()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        // Create two categories
        $cat1 = Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);
        $cat2 = Category::factory()->create(['slug' => 'chor', 'user_id' => $user->id]);

        // Create a task only for 'work' and add completions
        $task = Task::factory()->create(['user_id' => $user->id, 'category_slug' => 'work']);
        TaskCompletion::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'completed_at' => Carbon::now(),
        ]);

        $response = $this->getJson('/api/stats');

        $response->assertStatus(200);
        $balance = $response->json('category_balance');

        // Both categories should appear
        $this->assertCount(2, $balance);

        $workBalance = collect($balance)->firstWhere('category_slug', 'work');
        $chorBalance = collect($balance)->firstWhere('category_slug', 'chor');

        $this->assertNotNull($workBalance);
        $this->assertNotNull($chorBalance);
        $this->assertEquals(1, $workBalance['count']);
        $this->assertEquals(0, $chorBalance['count']);
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

    public function test_subcategory_trends_include_zero_completion_subcategories()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);

        // Task A: subcategory "coding" with completions
        $taskA = Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
            'subcategory' => 'coding',
        ]);
        TaskCompletion::create([
            'task_id' => $taskA->id,
            'user_id' => $user->id,
            'completed_at' => Carbon::now(),
        ]);

        // Task B: subcategory "meetings" with zero completions
        Task::factory()->create([
            'user_id' => $user->id,
            'category_slug' => 'work',
            'subcategory' => 'meetings',
        ]);

        $response = $this->getJson('/api/stats');
        $response->assertStatus(200);

        $groups = $response->json('trends.subcategory');
        $this->assertCount(1, $groups);
        $this->assertEquals('work', $groups[0]['category_slug']);
        $this->assertCount(2, $groups[0]['items']);

        $coding = collect($groups[0]['items'])->firstWhere('name', 'coding');
        $meetings = collect($groups[0]['items'])->firstWhere('name', 'meetings');
        $this->assertNotNull($coding);
        $this->assertNotNull($meetings);
        $this->assertEquals(1, $coding['count']);
        $this->assertEquals(0, $meetings['count']);
    }

    public function test_subcategory_trends_grouped_by_category()
    {
        $user = User::factory()->create();
        $this->actingAs($user);

        Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);
        Category::factory()->create(['slug' => 'health', 'user_id' => $user->id]);

        $taskW = Task::factory()->create([
            'user_id' => $user->id, 'category_slug' => 'work', 'subcategory' => 'coding',
        ]);
        $taskH = Task::factory()->create([
            'user_id' => $user->id, 'category_slug' => 'health', 'subcategory' => 'running',
        ]);

        TaskCompletion::create(['task_id' => $taskW->id, 'user_id' => $user->id, 'completed_at' => Carbon::now()]);
        TaskCompletion::create(['task_id' => $taskH->id, 'user_id' => $user->id, 'completed_at' => Carbon::now()]);

        $response = $this->getJson('/api/stats');
        $groups = $response->json('trends.subcategory');

        $this->assertCount(2, $groups);
        $slugs = collect($groups)->pluck('category_slug')->sort()->values()->toArray();
        $this->assertEquals(['health', 'work'], $slugs);
    }

    public function test_subcategory_trends_respects_period()
    {
        $user = User::factory()->create();
        $this->actingAs($user);
        Category::factory()->create(['slug' => 'work', 'user_id' => $user->id]);

        $task = Task::factory()->create([
            'user_id' => $user->id, 'category_slug' => 'work', 'subcategory' => 'coding',
        ]);

        // Completion 200 days ago (within 365, outside 90)
        TaskCompletion::create([
            'task_id' => $task->id,
            'user_id' => $user->id,
            'completed_at' => Carbon::now()->subDays(200),
        ]);

        // 90-day period: count should be 0
        $response90 = $this->getJson('/api/stats?period=90');
        $items90 = $response90->json('trends.subcategory')[0]['items'];
        $this->assertEquals(0, collect($items90)->firstWhere('name', 'coding')['count']);

        // 365-day period: count should be 1
        $response365 = $this->getJson('/api/stats?period=365');
        $items365 = $response365->json('trends.subcategory')[0]['items'];
        $this->assertEquals(1, collect($items365)->firstWhere('name', 'coding')['count']);
    }
}
