<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SettingsController extends Controller
{
    /**
     * Get user settings.
     * @return Collection<string, mixed>
     */
    public function index(): Collection
    {
        return Setting::where('user_id', $this->user()->id)->pluck('value', 'key');
    }

    /**
     * Update user settings.
     * @return Collection<string, mixed>
     */
    public function update(Request $request): Collection
    {
        $validated = $request->validate([
            'settings' => 'required|array',
        ]);

        foreach ($validated['settings'] as $key => $value) {
            Setting::updateOrCreate(
                ['key' => $key, 'user_id' => $this->user()->id],
                ['value' => $value]
            );
        }

        return Setting::where('user_id', $this->user()->id)->pluck('value', 'key');
    }
}
