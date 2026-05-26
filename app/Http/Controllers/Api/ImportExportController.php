<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Task;
use App\Models\SubcatCoeff;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class ImportExportController extends Controller
{
    public function export()
    {
        $data = [
            'tasks' => Task::all(),
            'categories' => Category::all()->keyBy('slug'),
            'subcatCoeffs' => SubcatCoeff::pluck('coefficient', 'name'),
            'notepad' => Setting::where('key', 'notepad_text')->value('value') ?? '',
        ];

        return response()->json($data);
    }

    public function import(Request $request)
    {
        $data = $request->all();

        DB::transaction(function () use ($data) {
            DB::statement('SET FOREIGN_KEY_CHECKS=0;');

            // Use delete() instead of truncate() for better transaction stability
            Task::query()->delete();
            Category::query()->delete();
            SubcatCoeff::query()->delete();

            // Import Categories
            if (isset($data['categories'])) {
                foreach ($data['categories'] as $slug => $cat) {
                    Category::create([
                        'slug' => $slug,
                        'name' => $cat['name'] ?? $slug,
                        'weight' => $cat['weight'] ?? 0.1,
                        'color' => $cat['color'] ?? '#8e8e93',
                        'hide_until' => $cat['hideUntil'] ?? ($cat['hide_until'] ?? null),
                    ]);
                }
            }

            // Import Tasks
            if (isset($data['tasks'])) {
                foreach ($data['tasks'] as $task) {
                    Task::create([
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
            if (!empty($data['subcatCoeffs'])) {
                foreach ($data['subcatCoeffs'] as $name => $coeff) {
                    SubcatCoeff::create([
                        'name' => $name,
                        'coefficient' => (float)$coeff,
                    ]);
                }
            }

            // Import Notepad
            if (isset($data['notepad'])) {
                Setting::updateOrCreate(['key' => 'notepad_text'], ['value' => $data['notepad']]);
            }

            DB::statement('SET FOREIGN_KEY_CHECKS=1;');
        });

        return response()->json(['message' => 'Import successful']);
    }
}
