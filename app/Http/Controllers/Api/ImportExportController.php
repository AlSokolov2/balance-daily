<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Setting;
use App\Models\SubcatCoeff;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

class ImportExportController extends Controller
{
    /**
     * Export all user data.
     */
    public function export(): JsonResponse
    {
        $user = $this->user();
        $data = [
            'tasks' => Task::where('user_id', $user->id)->get(),
            'categories' => Category::where('user_id', $user->id)->get()->keyBy('slug'),
            'subcatCoeffs' => SubcatCoeff::where('user_id', $user->id)->pluck('coefficient', 'name'),
            'notepad' => Setting::where('user_id', $user->id)->where('key', 'notepad_text')->value('value') ?? '',
        ];

        return response()->json($data);
    }

    /**
     * Import user data (overwrites existing).
     */
    public function import(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'categories' => 'nullable|array',
            'categories.*.name' => 'nullable|string|max:255',
            'categories.*.weight' => 'nullable|numeric|min:0|max:100',
            'categories.*.color' => 'nullable|string|max:7',
            'categories.*.hideUntil' => 'nullable|string|max:5',
            'categories.*.hide_until' => 'nullable|string|max:5',
            'tasks' => 'nullable|array|max:10000',
            'tasks.*.title' => 'nullable|string|max:500',
            'tasks.*.category' => 'nullable|string|max:100',
            'tasks.*.category_slug' => 'nullable|string|max:100',
            'tasks.*.importance' => 'nullable|numeric|min:0|max:100',
            'tasks.*.subcategory' => 'nullable|string|max:255',
            'tasks.*.deadline' => 'nullable|date',
            'tasks.*.repeatType' => 'nullable|string|max:50',
            'tasks.*.repeat_type' => 'nullable|string|max:50',
            'tasks.*.repeatInterval' => 'nullable|integer|min:1|max:365',
            'tasks.*.repeat_interval' => 'nullable|integer|min:1|max:365',
            'tasks.*.repeatDays' => 'nullable|array',
            'tasks.*.repeat_days' => 'nullable|array',
            'tasks.*.notes' => 'nullable|string|max:10000',
            'tasks.*.completed' => 'nullable|boolean',
            'tasks.*.ha' => 'nullable|boolean',
            'tasks.*.forceActive' => 'nullable|boolean',
            'tasks.*.force_active' => 'nullable|boolean',
            'tasks.*.hiddenUntil' => 'nullable|date',
            'tasks.*.hidden_until' => 'nullable|date',
            'tasks.*.missedCount' => 'nullable|integer|min:0',
            'tasks.*.missed_count' => 'nullable|integer|min:0',
            'subcatCoeffs' => 'nullable|array',
            'subcatCoeffs.*' => 'nullable|numeric|min:0|max:10',
            'notepad' => 'nullable|string|max:100000',
        ]);

        $user = $this->user();
        $userId = $user->id;

        DB::transaction(function () use ($validated, $userId) {
            Schema::disableForeignKeyConstraints();

            // Clear existing for THIS user
            Task::where('user_id', $userId)->delete();
            Category::where('user_id', $userId)->delete();
            SubcatCoeff::where('user_id', $userId)->delete();

            // Import Categories
            if (isset($validated['categories']) && is_iterable($validated['categories'])) {
                foreach ($validated['categories'] as $slug => $cat) {
                    $weight = (float) ($cat['weight'] ?? 0.1);
                    // If weight is sent as percentage (e.g. 50 instead of 0.5), normalize it
                    if ($weight > 1) {
                        $weight /= 100;
                    }

                    Category::create([
                        'user_id' => $userId,
                        'slug' => $slug,
                        'name' => $cat['name'] ?? $slug,
                        'weight' => $weight,
                        'color' => $cat['color'] ?? '#8e8e93',
                        'hide_until' => $cat['hideUntil'] ?? ($cat['hide_until'] ?? null),
                    ]);
                }
            }

            // Import Tasks
            if (isset($validated['tasks']) && is_iterable($validated['tasks'])) {
                foreach ($validated['tasks'] as $task) {
                    Task::create([
                        'user_id' => $userId,
                        'title' => $task['title'] ?? 'Untitled',
                        'category_slug' => $task['category'] ?? ($task['category_slug'] ?? 'chor'),
                        'importance' => $task['importance'] ?? 2.0,
                        'subcategory' => $task['subcategory'] ?? null,
                        'deadline' => $task['deadline'] ?? null,
                        'postpone_until' => $task['postponeUntil'] ?? ($task['postpone_until'] ?? null),
                        'repeat_type' => $task['repeatType'] ?? ($task['repeat_type'] ?? 'none'),
                        'repeat_interval' => $task['repeatInterval'] ?? ($task['repeat_interval'] ?? 1),
                        'repeat_days' => $task['repeatDays'] ?? ($task['repeat_days'] ?? []),
                        'ha' => $task['ha'] ?? false,
                        'force_active' => $task['forceActive'] ?? ($task['force_active'] ?? false),
                        'notes' => $task['notes'] ?? '',
                        'completed' => $task['completed'] ?? false,
                        'completed_at' => $task['completedAt'] ?? ($task['completed_at'] ?? null),
                        'last_completed_date' => $task['lastCompletedDate'] ?? ($task['last_completed_date'] ?? null),
                        'hidden_until' => $task['hiddenUntil'] ?? ($task['hidden_until'] ?? null),
                        'missed_count' => $task['missedCount'] ?? ($task['missed_count'] ?? 0),
                    ]);
                }
            }

            // Import SubcatCoeffs
            if (! empty($validated['subcatCoeffs']) && is_iterable($validated['subcatCoeffs'])) {
                foreach ($validated['subcatCoeffs'] as $name => $coeff) {
                    SubcatCoeff::create([
                        'user_id' => $userId,
                        'name' => $name,
                        'coefficient' => (float) $coeff,
                    ]);
                }
            }

            // Import Notepad
            if (isset($validated['notepad'])) {
                Setting::updateOrCreate(
                    ['key' => 'notepad_text', 'user_id' => $userId],
                    ['value' => (string) $validated['notepad']]
                );
            }

            Schema::enableForeignKeyConstraints();
        });

        return response()->json(['message' => 'Import successful']);
    }
}
