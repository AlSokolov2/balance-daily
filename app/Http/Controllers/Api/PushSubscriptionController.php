<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\Request;

class PushSubscriptionController extends Controller
{
    /**
     * Store a new push subscription.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        // Decryption cast works for updateOrCreate on 'values', 
        // but for 'attributes' (endpoint) we need to be careful.
        // updateOrCreate uses get() to find existing.
        
        $sub = $request->user()->pushSubscriptions()
            ->get()
            ->firstWhere('endpoint', $validated['endpoint']);

        if ($sub) {
            $sub->update([
                'public_key' => $validated['public_key'],
                'auth_token' => $validated['auth_token'],
            ]);
        } else {
            $request->user()->pushSubscriptions()->create($validated);
        }

        return response()->json(['message' => 'Subscription saved']);
    }

    /**
     * Remove a push subscription.
     */
    public function destroy(Request $request)
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $sub = $request->user()->pushSubscriptions()
            ->get()
            ->firstWhere('endpoint', $request->endpoint);

        if ($sub) {
            $sub->delete();
        }

        return response()->noContent();
    }
}
