<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskCompletion;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class StatsController extends Controller
{
    /**
     * Get aggregated statistics for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        $user = $request->user();
        $now = Carbon::now();

        // Fetch completions once
        $completions = TaskCompletion::where('user_id', $user->id)
            ->where('completed_at', '>=', $now->copy()->subDays(90)->startOfDay())
            ->orderBy('completed_at', 'ASC')
            ->get();

        // 1. Heatmap
        $heatmap = $completions->groupBy(fn($c) => $c->completed_at->toDateString())
            ->map(fn($group) => $group->count());

        // 2. Category Balance
        $categoryBalance = DB::table('task_completions')
            ->join('tasks', 'task_completions.task_id', '=', 'tasks.id')
            ->where('task_completions.user_id', $user->id)
            ->where('task_completions.completed_at', '>=', $now->copy()->subDays(30)->startOfDay())
            ->select('tasks.category_slug', DB::raw('count(*) as count'))
            ->groupBy('tasks.category_slug')
            ->get();

        // 3. Basic Counters
        $todayCount = $completions->filter(fn($c) => $c->completed_at->isToday())->count();
        $totalCount = TaskCompletion::where('user_id', $user->id)->count();

        // 4. General Activity Streak
        $streakData = $this->calculateGeneralStreak($user->id);

        return response()->json([
            'heatmap' => $heatmap,
            'category_balance' => $categoryBalance,
            'counters' => [
                'today' => $todayCount,
                'total' => $totalCount,
                'current_streak' => $streakData['current'],
                'longest_streak' => $streakData['longest'],
            ],
        ]);
    }

    /**
     * Calculate the user's general activity streak using string-based date comparison for robustness.
     * 
     * @param int $userId
     * @return array
     */
    private function calculateGeneralStreak($userId)
    {
        $allDates = TaskCompletion::where('user_id', $userId)
            ->orderBy('completed_at', 'DESC')
            ->get()
            ->map(fn($c) => $c->completed_at->toDateString())
            ->unique()
            ->values()
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
