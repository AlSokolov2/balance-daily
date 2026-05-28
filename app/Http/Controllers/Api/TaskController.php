<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    /**
     * Get all tasks for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index(Request $request)
    {
        return $request->user()->tasks()->orderBy('completed')->get();
    }

    /**
     * Create a new task for the authenticated user.
     *
     * @param Request $request
     * @return \App\Models\Task
     */
    public function store(Request $request)
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
        ]);

        return $request->user()->tasks()->create($validated);
    }

    /**
     * Get a specific task.
     *
     * @param Request $request
     * @param \App\Models\Task $task
     * @return \App\Models\Task
     */
    public function show(Request $request, Task $task)
    {
        abort_if($task->user_id !== $request->user()->id, 404);
        return $task;
    }

    /**
     * Update an existing task.
     *
     * @param Request $request
     * @param \App\Models\Task $task
     * @return \App\Models\Task
     */
    public function update(Request $request, Task $task)
    {
        abort_if($task->user_id !== $request->user()->id, 404);

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
        ]);

        $task->update($validated);

        return $task;
    }

    /**
     * Delete a task.
     *
     * @param Request $request
     * @param \App\Models\Task $task
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Task $task)
    {
        abort_if($task->user_id !== $request->user()->id, 404);
        $task->delete();

        return response()->noContent();
    }
}
