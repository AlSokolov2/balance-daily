<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PushSubscription;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class PushSubscriptionController extends Controller
{
    /**
     * Store a new push subscription.
     */
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'endpoint' => 'required|string',
            'public_key' => 'required|string',
            'auth_token' => 'required|string',
        ]);

        $sub = $this->user()->pushSubscriptions()
            ->where('endpoint', $validated['endpoint'])
            ->first();

        if ($sub) {
            $sub->update([
                'public_key' => $validated['public_key'],
                'auth_token' => $validated['auth_token'],
            ]);
        } else {
            $this->user()->pushSubscriptions()->create($validated);
        }

        return response()->json(['message' => 'Subscription saved']);
    }

    /**
     * Remove a push subscription.
     */
    public function destroy(Request $request): Response
    {
        $request->validate([
            'endpoint' => 'required|string',
        ]);

        $sub = $this->user()->pushSubscriptions()
            ->where('endpoint', (string) $request->input('endpoint'))
            ->first();

        if ($sub) {
            $sub->delete();
        }

        return response()->noContent();
    }
}
