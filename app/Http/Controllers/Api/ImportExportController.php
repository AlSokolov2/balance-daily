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
        $data = $request->all();
        $user = $this->user();
        $userId = $user->id;

        DB::transaction(function () use ($data, $userId) {
            Schema::disableForeignKeyConstraints();

            // Clear existing for THIS user
            Task::where('user_id', $userId)->delete();
            Category::where('user_id', $userId)->delete();
            SubcatCoeff::where('user_id', $userId)->delete();

            // Import Categories
            if (isset($data['categories']) && is_iterable($data['categories'])) {
                foreach ($data['categories'] as $slug => $cat) {
                    Category::create([
                        'user_id' => $userId,
                        'slug' => $slug,
                        'name' => $cat['name'] ?? $slug,
                        'weight' => $cat['weight'] ?? 0.1,
                        'color' => $cat['color'] ?? '#8e8e93',
                        'hide_until' => $cat['hideUntil'] ?? ($cat['hide_until'] ?? null),
                    ]);
                }
            }

            // Import Tasks
            if (isset($data['tasks']) && is_iterable($data['tasks'])) {
                foreach ($data['tasks'] as $task) {
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
            if (! empty($data['subcatCoeffs']) && is_iterable($data['subcatCoeffs'])) {
                foreach ($data['subcatCoeffs'] as $name => $coeff) {
                    SubcatCoeff::create([
                        'user_id' => $userId,
                        'name' => $name,
                        'coefficient' => (float) $coeff,
                    ]);
                }
            }

            // Import Notepad
            if (isset($data['notepad'])) {
                Setting::updateOrCreate(
                    ['key' => 'notepad_text', 'user_id' => $userId],
                    ['value' => (string) $data['notepad']]
                );
            }

            Schema::enableForeignKeyConstraints();
        });

        return response()->json(['message' => 'Import successful']);
    }
}
