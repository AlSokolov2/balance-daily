<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->tasks()->orderBy('completed')->get();
    }

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

    public function show(Request $request, $id)
    {
        return $request->user()->tasks()->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $task = $request->user()->tasks()->findOrFail($id);

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

    public function destroy(Request $request, $id)
    {
        $task = $request->user()->tasks()->findOrFail($id);
        $task->delete();

        return response()->noContent();
    }
}
