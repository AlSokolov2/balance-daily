<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Setting;
use App\Models\SubcatCoeff;
use App\Models\SyncDelete;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SyncController extends Controller
{
    /**
     * Sync data between client and server.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $this->user();
        $since = $request->input('since') ? Carbon::parse((string) $request->input('since')) : null;
        $now = now();

        /** @var array{tasks: array{updated: iterable<Task>, deleted: array<int>}, categories: array{updated: iterable<Category>, deleted: array<int>}, settings: iterable<string, mixed>, subcatCoeffs: iterable<string, mixed>, server_time: string} $response */
        $response = [
            'tasks' => [
                'updated' => [],
                'deleted' => [],
            ],
            'categories' => [
                'updated' => [],
                'deleted' => [],
            ],
            'settings' => [],
            'subcatCoeffs' => [],
            'server_time' => $now->toISOString(),
        ];

        // 1. Fetch updated items
        if ($since) {
            $response['tasks']['updated'] = Task::where('user_id', $user->id)
                ->where('updated_at', '>', $since)
                ->get();

            $response['categories']['updated'] = Category::where('user_id', $user->id)
                ->where('updated_at', '>', $since)
                ->get();

            // Deleted items log
            $deleted = SyncDelete::where('user_id', $user->id)
                ->where('deleted_at', '>', $since)
                ->get();

            foreach ($deleted as $d) {
                $type = strtolower((string) $d->model_type).'s';
                if (isset($response[$type]) && is_array($response[$type])) {
                    $response[$type]['deleted'][] = (int) $d->model_id;
                }
            }
        } else {
            // Full snapshot
            $response['tasks']['updated'] = Task::where('user_id', $user->id)->get();
            $response['categories']['updated'] = Category::where('user_id', $user->id)->get();
        }

        // Always include settings
        $response['settings'] = Setting::where('user_id', $user->id)->pluck('value', 'key');

        // Export subcat coeffs
        $response['subcatCoeffs'] = SubcatCoeff::where('user_id', $user->id)->pluck('coefficient', 'name');

        return response()->json($response);
    }
}
