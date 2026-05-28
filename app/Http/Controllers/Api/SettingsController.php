<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;

class SettingsController extends Controller
{
    public function index()
    {
        $user = auth()->user();
        $today = now()->toDateString();

        if ($user->last_reset_date !== $today) {
            // It's a new day! Perform auto-reset logic.
            // 1. Mark completed tasks as part of history (no action needed if we just filter by date)
            // 2. We could archive them if needed, but current logic relies on completed_at.
            
            // Just update the reset date for now to signify we've synchronized.
            $user->update(['last_reset_date' => $today]);
        }

        return Setting::where('user_id', $user->id)->pluck('value', 'key');
    }

    public function update(Request $request)
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key, 'user_id' => auth()->id()],
                ['value' => $value]
            );
        }

        return Setting::where('user_id', auth()->id())->pluck('value', 'key');
    }
}
