<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\TaskCompletion;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class TaskCompletionController extends Controller
{
    /**
     * Add a completion record for a task.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'task_id' => 'required|integer|exists:tasks,id',
            'completed_at' => 'required|date',
        ]);

        // Verify task belongs to user
        /** @var \App\Models\Task $task */
        $task = $this->user()->tasks()->findOrFail($validated['task_id']);

        $completion = $task->completions()->create([
            'user_id' => $this->user()->id,
            'completed_at' => $validated['completed_at'],
        ]);

        return response()->json($completion, 201);
    }

    /**
     * Delete a completion record.
     */
    public function destroy(string $id): Response
    {
        $completion = TaskCompletion::whereHas('task', function ($query) {
            $query->where('user_id', $this->user()->id);
        })->findOrFail($id);

        $completion->delete();

        return response()->noContent();
    }
}
