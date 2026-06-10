<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskController extends Controller
{
    /**
     * Get all tasks for the authenticated user.
     *
     * @return Collection<int, Task>
     */
    public function index(Request $request): Collection
    {
        return $this->user()->tasks()
            ->with('latestCompletion')
            ->orderBy('completed')
            ->get();
    }

    /**
     * Create a new task for the authenticated user.
     */
    public function store(Request $request): Task
    {
        $validated = $request->validate([
            'title' => 'required|string',
            'category_slug' => 'required|string',
            'importance' => 'required|numeric',
            'subcategory' => 'nullable|string',
            'deadline' => 'nullable|date',
            'postpone_until' => 'nullable|date',
            'repeat_type' => 'nullable|string',
            'repeat_interval' => 'nullable|integer',
            'repeat_days' => 'nullable|array',
            'ha' => 'nullable|boolean',
            'force_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'hidden_until' => 'nullable|date',
            'last_completed_date' => 'nullable|date',
            'missed_count' => 'nullable|integer',
        ]);

        /** @var Task $task */
        $task = $this->user()->tasks()->create($validated);
        
        return $task->load('latestCompletion');
    }

    /**
     * Get a specific task.
     */
    public function show(Request $request, string $id): Task
    {
        /** @var Task $task */
        $task = $this->user()->tasks()
            ->with(['latestCompletion', 'completions' => function ($query) {
                $query->orderBy('completed_at', 'desc');
            }])
            ->findOrFail($id);

        return $task;
    }

    /**
     * Update an existing task.
     */
    public function update(Request $request, string $id): Task
    {
        /** @var Task $task */
        $task = $this->user()->tasks()->findOrFail($id);

        $validated = $request->validate([
            'title' => 'sometimes|required|string',
            'category_slug' => 'sometimes|required|string',
            'importance' => 'sometimes|required|numeric',
            'subcategory' => 'nullable|string',
            'deadline' => 'nullable|date',
            'postpone_until' => 'nullable|date',
            'repeat_type' => 'nullable|string',
            'repeat_interval' => 'nullable|integer',
            'repeat_days' => 'nullable|array',
            'ha' => 'nullable|boolean',
            'force_active' => 'nullable|boolean',
            'notes' => 'nullable|string',
            'completed' => 'sometimes|required|boolean',
            'completed_at' => 'nullable|date',
            'hidden_until' => 'nullable|date',
            'last_completed_date' => 'nullable|date',
            'missed_count' => 'nullable|integer',
            '_was_completed' => 'nullable|boolean',
        ]);

        $wasCompleted = $task->completed;
        $isCompletionEvent = (! $wasCompleted && ($validated['completed'] ?? false)) || ($request->input('_was_completed') === true);
        
        $task->fill($validated);

        // If task is being marked as completed (directly or via offline-reset flag)
        if ($isCompletionEvent) {
            // 1. Record completion in history
            $task->completions()->create([
                'user_id' => $this->user()->id,
                'completed_at' => $task->completed_at ?? now(),
            ]);

            // 2. Handle Recurring Logic (Server-side source of truth)
            if ($task->repeat_type && $task->repeat_type !== 'none') {
                $now = now();
                $nextDate = now();

                if ($task->repeat_type === 'interval') {
                    $nextDate->addDays((int) ($task->repeat_interval ?: 1));
                } elseif ($task->repeat_type === 'weekly' && ! empty($task->repeat_days)) {
                    $nextDate->addDay();
                    while (! in_array($nextDate->dayOfWeek, $task->repeat_days)) {
                        $nextDate->addDay();
                    }
                }

                $task->completed = false;
                $task->completed_at = null;
                $task->hidden_until = $nextDate->startOfDay();
                $task->last_completed_date = $now;
                $task->missed_count = 0;
            }
        }

        $task->save();

        return $task->load('latestCompletion');
    }

    /**
     * Delete a task.
     */
    public function destroy(Request $request, string $id): Response
    {
        /** @var Task $task */
        $task = $this->user()->tasks()->findOrFail($id);
        $task->delete();

        return response()->noContent();
    }
}
