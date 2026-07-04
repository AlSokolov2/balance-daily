<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Task;
use App\Models\TaskCompletion;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Get aggregated statistics for the authenticated user.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->user();
        $now = Carbon::now();

        // Optional date filter: return completions for a specific date
        if ($request->has('date')) {
            return $this->completionsByDate($request->input('date'), (int) $user->id);
        }

        // Fetch completions once
        /** @var \Illuminate\Database\Eloquent\Collection<int, TaskCompletion> $completions */
        $completions = TaskCompletion::where('user_id', $user->id)
            ->where('completed_at', '>=', $now->copy()->subDays(90)->startOfDay())
            ->orderBy('completed_at', 'asc')
            ->get();

        // 1. Heatmap
        $heatmap = $completions->groupBy(fn ($c) => $c->completed_at->toDateString())
            ->map(fn ($group) => $group->count());

        // 2. Category Balance
        $categoryBalance = DB::table('task_completions')
            ->join('tasks', 'task_completions.task_id', '=', 'tasks.id')
            ->where('task_completions.user_id', $user->id)
            ->where('task_completions.completed_at', '>=', $now->copy()->subDays(30)->startOfDay())
            ->select('tasks.category_slug', DB::raw('count(*) as count'))
            ->groupBy('tasks.category_slug')
            ->get();

        // 3. Basic Counters
        $todayCount = $completions->filter(fn ($c) => $c->completed_at->isToday())->count();
        $totalCount = TaskCompletion::where('user_id', $user->id)->count();

        // 4. General Activity Streak
        $streakData = $this->calculateGeneralStreak((int) $user->id);

        // 5. System Status Block
        $status = $this->calculateStatus((int) $user->id, $now, $todayCount);

        // 6. Trends
        $trends = $this->calculateTrends((int) $user->id, $completions, $now);

        return response()->json([
            'heatmap' => $heatmap,
            'category_balance' => $categoryBalance,
            'counters' => [
                'today' => $todayCount,
                'total' => $totalCount,
                'current_streak' => $streakData['current'],
                'longest_streak' => $streakData['longest'],
            ],
            'status' => $status,
            'trends' => $trends,
        ]);
    }

    /**
     * Calculate system status: active tasks, overdue, postponed, hidden,
     * completion rate, and per-category health.
     *
     * @return array{active_tasks: int, overdue_tasks: int, postponed_tasks: int, hidden_tasks: int, completed_today: int, completion_rate: float, categories_health: array<string, array{active: int, completed_today: int, needs_attention: bool}>}
     */
    private function calculateStatus(int $userId, Carbon $now, int $todayCount): array
    {
        /** @var \Illuminate\Database\Eloquent\Collection<int, Task> $allTasks */
        $allTasks = Task::where('user_id', $userId)
            ->where('completed', false)
            ->get();

        /** @var \Illuminate\Database\Eloquent\Collection<int, Category> $categories */
        $categories = Category::where('user_id', $userId)->get();
        $catsMap = $categories->keyBy('slug');

        $activeTasks = 0;
        $overdueTasks = 0;
        $postponedTasks = 0;
        $hiddenTasks = 0;
        $perCatActive = [];
        $perCatCompletedToday = [];

        // Init per-category counters
        foreach ($categories as $cat) {
            $perCatActive[$cat->slug] = 0;
            $perCatCompletedToday[$cat->slug] = 0;
        }

        foreach ($allTasks as $task) {
            $isHidden = $task->hidden_until && $task->hidden_until > $now;
            $isPostponed = ($task->postpone_until && $task->postpone_until > $now)
                || (! $task->force_active && $this->isCategoryPostponedNow($catsMap->get($task->category_slug), $now));

            if ($isHidden) {
                $hiddenTasks++;
                continue; // Hidden tasks are not counted as active
            }

            $activeTasks++;

            if ($task->deadline && $task->deadline < $now) {
                $overdueTasks++;
            }

            if ($isPostponed) {
                $postponedTasks++;
            }

            // Per-category counts
            $slug = $task->category_slug;
            if (isset($perCatActive[$slug])) {
                $perCatActive[$slug]++;
            }
        }

        // Count completions today per category
        $catCompletionsToday = TaskCompletion::where('task_completions.user_id', $userId)
            ->where('task_completions.completed_at', '>=', $now->copy()->startOfDay())
            ->join('tasks', 'task_completions.task_id', '=', 'tasks.id')
            ->select('tasks.category_slug', DB::raw('count(*) as count'))
            ->groupBy('tasks.category_slug')
            ->pluck('count', 'category_slug');

        foreach ($catCompletionsToday as $slug => $count) {
            if (isset($perCatCompletedToday[$slug])) {
                $perCatCompletedToday[$slug] = (int) $count;
            }
        }

        // Build categories_health
        $categoriesHealth = [];
        foreach ($categories as $cat) {
            $categoriesHealth[$cat->slug] = [
                'active' => $perCatActive[$cat->slug] ?? 0,
                'completed_today' => $perCatCompletedToday[$cat->slug] ?? 0,
                'needs_attention' => ($perCatActive[$cat->slug] ?? 0) > 0
                    && ($perCatCompletedToday[$cat->slug] ?? 0) === 0,
            ];
        }

        $completionRate = ($activeTasks + $todayCount) > 0
            ? round($todayCount / ($activeTasks + $todayCount), 2)
            : 0.0;

        return [
            'active_tasks' => $activeTasks,
            'overdue_tasks' => $overdueTasks,
            'postponed_tasks' => $postponedTasks,
            'hidden_tasks' => $hiddenTasks,
            'completed_today' => $todayCount,
            'completion_rate' => $completionRate,
            'categories_health' => $categoriesHealth,
        ];
    }

    /**
     * Calculate trends: weekly completions, day-of-week breakdown,
     * hour-of-day heatmap, and subcategory performance.
     *
     * @param  \Illuminate\Database\Eloquent\Collection<int, TaskCompletion>  $completions
     * @return array{weekly: array<int, array{week_start: string, count: int}>, day_of_week: array<int, array{day: int, count: int}>, hour_of_day: array<int, array{hour: int, count: int}>, subcategory: array<int, array{name: string, count: int}>}
     */
    private function calculateTrends(int $userId, $completions, Carbon $now): array
    {
        // 1. Weekly completions (last 12 weeks)
        $weekly = [];
        for ($i = 11; $i >= 0; $i--) {
            $weekStart = $now->copy()->subWeeks($i)->startOfWeek(Carbon::MONDAY);
            $weekEnd = $weekStart->copy()->endOfWeek(Carbon::SUNDAY);
            $count = $completions->filter(fn ($c) =>
                $c->completed_at->between($weekStart, $weekEnd)
            )->count();
            $weekly[] = [
                'week_start' => $weekStart->toDateString(),
                'count' => $count,
            ];
        }

        // 2. Day-of-week breakdown (0=Sun..6=Sat, last 90 days)
        $dayOfWeek = [];
        for ($d = 0; $d < 7; $d++) {
            $dayCompletions = $completions->filter(fn ($c) => (int) $c->completed_at->dayOfWeek === $d);
            $dayOfWeek[] = [
                'day' => $d,
                'count' => $dayCompletions->count(),
            ];
        }

        // 3. Hour-of-day breakdown (0..23, last 90 days)
        $hourOfDay = [];
        for ($h = 0; $h < 24; $h++) {
            $hourCompletions = $completions->filter(fn ($c) => (int) $c->completed_at->hour === $h);
            $hourOfDay[] = [
                'hour' => $h,
                'count' => $hourCompletions->count(),
            ];
        }

        // 4. Subcategory performance (last 90 days)
        $subcategoryData = DB::table('task_completions')
            ->where('task_completions.user_id', $userId)
            ->where('task_completions.completed_at', '>=', $now->copy()->subDays(90)->startOfDay())
            ->join('tasks', 'task_completions.task_id', '=', 'tasks.id')
            ->whereNotNull('tasks.subcategory')
            ->where('tasks.subcategory', '!=', '')
            ->select('tasks.subcategory as name', DB::raw('count(*) as count'))
            ->groupBy('tasks.subcategory')
            ->orderByDesc('count')
            ->limit(10)
            ->get();

        return [
            'weekly' => $weekly,
            'day_of_week' => $dayOfWeek,
            'hour_of_day' => $hourOfDay,
            'subcategory' => $subcategoryData,
        ];
    }

    /**
     * Check if a category is currently hidden by its hide_until time.
     * hide_until is stored as "HH:MM" string and applies to the current day.
     */
    private function isCategoryPostponedNow(?Category $cat, Carbon $now): bool
    {
        if (! $cat || ! $cat->hide_until) {
            return false;
        }

        $parts = explode(':', $cat->hide_until);
        if (count($parts) !== 2) {
            return false;
        }

        $h = (int) $parts[0];
        $m = (int) $parts[1];

        $hideTime = $now->copy()->setTime($h, $m);

        return $now->lt($hideTime);
    }

    /**
     * Get tasks completed on a specific date with their titles.
     */
    private function completionsByDate(string $date, int $userId): JsonResponse
    {
        $dateObj = Carbon::parse($date);

        $completions = TaskCompletion::where('task_completions.user_id', $userId)
            ->whereDate('task_completions.completed_at', $dateObj)
            ->join('tasks', 'task_completions.task_id', '=', 'tasks.id')
            ->select(
                'task_completions.id',
                'task_completions.task_id',
                'task_completions.completed_at',
                'tasks.title',
                'tasks.category_slug'
            )
            ->orderBy('task_completions.completed_at', 'desc')
            ->get();

        $count = $completions->count();

        return response()->json([
            'date' => $dateObj->toDateString(),
            'count' => $count,
            'completions' => $completions,
        ]);
    }

    /**
     * Calculate the user's general activity streak using string-based date comparison for robustness.
     *
     * @return array{current: int, longest: int}
     */
    private function calculateGeneralStreak(int $userId): array
    {
        /** @var list<string> $allDates */
        $allDates = TaskCompletion::where('user_id', $userId)
            ->selectRaw('DISTINCT DATE(completed_at) as date')
            ->orderBy('date', 'desc')
            ->pluck('date')
            ->toArray();

        if (empty($allDates)) {
            return ['current' => 0, 'longest' => 0];
        }

        $today = Carbon::today()->toDateString();
        $yesterday = Carbon::yesterday()->toDateString();

        $currentStreak = 0;
        if ($allDates[0] === $today || $allDates[0] === $yesterday) {
            $checkDate = Carbon::parse($allDates[0]);
            foreach ($allDates as $dateStr) {
                if ($dateStr === $checkDate->toDateString()) {
                    $currentStreak++;
                    $checkDate->subDay();
                } else {
                    break;
                }
            }
        }

        $longestStreak = 0;
        $tempStreak = 0;
        $prevDateStr = null;

        $chronologicalDates = array_reverse($allDates);
        foreach ($chronologicalDates as $dateStr) {
            if ($prevDateStr === null) {
                $tempStreak = 1;
            } else {
                $expectedPrevDate = Carbon::parse($dateStr)->subDay()->toDateString();
                if ($expectedPrevDate === $prevDateStr) {
                    $tempStreak++;
                } else {
                    $longestStreak = max($longestStreak, $tempStreak);
                    $tempStreak = 1;
                }
            }
            $prevDateStr = $dateStr;
        }
        $longestStreak = max($longestStreak, $tempStreak);

        return [
            'current' => $currentStreak,
            'longest' => $longestStreak,
        ];
    }
}
