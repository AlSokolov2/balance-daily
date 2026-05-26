<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Laravel\Socialite\Facades\Socialite;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    public function redirectToGoogle()
    {
        return Socialite::driver('google')->redirect();
    }

    public function handleGoogleCallback()
    {
        try {
            $googleUser = Socialite::driver('google')->user();
            
            $user = User::updateOrCreate([
                'google_id' => $googleUser->id,
            ], [
                'name' => $googleUser->name,
                'email' => $googleUser->email,
                'avatar' => $googleUser->avatar,
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);

            // Seed default categories if new user
            if ($user->wasRecentlyCreated || $user->categories()->count() === 0) {
                $defaults = [
                    ['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.13, 'color' => '#ff3b30'],
                    ['slug' => 'prog', 'name' => 'PROG', 'weight' => 0.46, 'color' => '#34c759'],
                    ['slug' => 'chin', 'name' => 'CHIN', 'weight' => 0.38, 'color' => '#007aff'],
                    ['slug' => 'hobb', 'name' => 'HOBB', 'weight' => 0.03, 'color' => '#ffcc00'],
                    ['slug' => '__archive__', 'name' => 'Архив', 'weight' => 0.01, 'color' => '#8e8e93'],
                ];
                foreach ($defaults as $cat) {
                    $user->categories()->updateOrCreate(['slug' => $cat['slug']], $cat);
                }
            }

            Auth::login($user);

            $token = $user->createToken('auth_token')->plainTextToken;

            // Redirect back to frontend
            // url('/') will respect APP_URL from .env (e.g. https://site.com/daily)
            $frontendUrl = url('/');
            
            return redirect($frontendUrl . '?token=' . $token);
            
        } catch (\Exception $e) {
            \Log::error('Google Auth Error: ' . $e->getMessage());
            return redirect('/?error=auth_failed');
        }
    }

    public function me(Request $request)
    {
        return $request->user();
    }

    public function logout(Request $request)
    {
        $request->user()->currentAccessToken()->delete();
        return response()->noContent();
    }
}
