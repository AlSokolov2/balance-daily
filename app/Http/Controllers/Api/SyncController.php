<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Setting;
use App\Models\SyncDelete;
use App\Models\Task;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class SyncController extends Controller
{
    public function index(Request $request)
    {
        $user = $request->user();
        $since = $request->input('since') ? Carbon::parse($request->input('since')) : null;
        $now = now();

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
                $response[strtolower($d->model_type) . 's']['deleted'][] = $d->model_id;
            }
        } else {
            // Full snapshot
            $response['tasks']['updated'] = Task::where('user_id', $user->id)->get();
            $response['categories']['updated'] = Category::where('user_id', $user->id)->get();
        }

        // Always include settings (they are small)
        // Use get() before pluck() to ensure decryption casts are applied
        $response['settings'] = Setting::where('user_id', $user->id)->get()->pluck('value', 'key');
        
        // Export subcat coeffs (also small)
        $response['subcatCoeffs'] = \App\Models\SubcatCoeff::where('user_id', $user->id)->get()->pluck('coefficient', 'name');

        return response()->json($response);
    }
}
