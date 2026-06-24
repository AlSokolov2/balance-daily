<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthCode;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;

class AuthController extends Controller
{
    /**
     * Redirect the user to the Google authentication page.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        /** @var RedirectResponse $response */
        $response = Socialite::driver('google')->redirect();

        return $response;
    }

    /**
     * Obtain the user information from Google.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        try {
            /** @var \Laravel\Socialite\Two\User $googleUser */
            $googleUser = Socialite::driver('google')->user();

            $user = User::updateOrCreate([
                'google_id' => $googleUser->getId(),
            ], [
                'name' => $googleUser->getName(),
                'email' => $googleUser->getEmail(),
                'avatar' => $googleUser->getAvatar(),
                'google_token' => $googleUser->token,
                'google_refresh_token' => $googleUser->refreshToken,
            ]);

            $this->seedDefaultCategories($user);

            Auth::login($user);

            $code = bin2hex(random_bytes(32));

            $user->authCodes()->create([
                'code' => hash('sha256', $code),
                'expires_at' => now()->addSeconds(60),
            ]);

            // Redirect back to frontend with one-time auth code
            return redirect(url('/') . '?code=' . $code);

        } catch (\Exception $e) {
            \Log::error('Google Auth Error: '.$e->getMessage());

            return redirect('/?error=auth_failed');
        }
    }

    /**
     * Fast login for development environments.
     */
    public function devLogin(): RedirectResponse
    {
        if (! app()->environment(['local', 'testing'])) {
            abort(404);
        }

        $user = User::firstOrCreate(
            ['email' => 'alsokolov2@gmail.com'],
            [
                'name' => 'AlSokolov',
                'google_id' => 'dev_id_alsokolov',
                'avatar' => 'https://www.gravatar.com/avatar/'.md5('alsokolov2@gmail.com').'?s=200&d=identicon',
            ]
        );

        $this->seedDefaultCategories($user);

        $code = bin2hex(random_bytes(32));

        $user->authCodes()->create([
            'code' => hash('sha256', $code),
            'expires_at' => now()->addSeconds(60),
        ]);

        return redirect(url('/') . '?code=' . $code);
    }

    /**
     * Exchange a one-time auth code for a Sanctum token.
     */
    public function exchangeCode(Request $request): JsonResponse
    {
        $request->validate(['code' => 'required|string']);

        $hashedCode = hash('sha256', $request->code);
        $authCode = AuthCode::where('code', $hashedCode)
            ->where('expires_at', '>', now())
            ->first();

        if (! $authCode) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $user = $authCode->user;
        $token = $user->createToken('auth_token')->plainTextToken;

        // Remove all codes for this user — one-time use
        $user->authCodes()->delete();

        return response()->json(['token' => $token]);
    }

    /**
     * Seed initial categories for a new user.
     */
    private function seedDefaultCategories(User $user): void
    {
        if ($user->categories()->count() === 0) {
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
    }

    /**
     * Get the authenticated user.
     */
    public function me(Request $request): User
    {
        return $this->user();
    }

    /**
     * Log the user out (revoke token).
     */
    public function logout(Request $request): Response
    {
        /** @var \Laravel\Sanctum\PersonalAccessToken $token */
        $token = $this->user()->currentAccessToken();
        $token->delete();

        return response()->noContent();
    }
}
