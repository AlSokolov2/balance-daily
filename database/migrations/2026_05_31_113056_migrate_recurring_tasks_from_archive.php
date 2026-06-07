<?php

use App\Models\Task;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Carbon;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Logic: Move recurring tasks from "Archive" (completed=true)
     * to "Hidden" or "Active" state based on their next occurrence.
     */
    public function up(): void
    {
        $tasks = Task::where('repeat_type', '!=', 'none')
            ->where('completed', true)
            ->get();

        foreach ($tasks as $task) {
            $baseDate = $task->last_completed_date
                ?? $task->completed_at
                ?? $task->updated_at
                ?? Carbon::now();

            $nextDate = $baseDate->copy();

            if ($task->repeat_type === 'interval') {
                $interval = (int) ($task->repeat_interval ?: 1);
                $nextDate->addDays($interval);
            } elseif ($task->repeat_type === 'weekly' && ! empty($task->repeat_days)) {
                $days = $task->repeat_days;
                $nextDate->addDay();
                // Find next day from allowed days
                while (! in_array($nextDate->dayOfWeek, $days)) {
                    $nextDate->addDay();
                }
            }

            $nextDate->startOfDay();

            // Apply updates
            $task->completed = false;
            $task->completed_at = null;
            $task->last_completed_date = $baseDate;

            if ($nextDate->isFuture()) {
                $task->hidden_until = $nextDate;
            } else {
                $task->hidden_until = null;
            }

            $task->save();
        }
    }

    /**
     * Reverse the migrations.
     *
     * Note: We don't have a reliable way to know which tasks
     * were previously completed, so we leave them as is.
     */
    public function down(): void
    {
        // Manual rollback if needed
    }
};
