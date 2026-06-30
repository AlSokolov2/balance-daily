<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthCode;
use App\Models\User;
use GuzzleHttp\Exception\ClientException;
use GuzzleHttp\Exception\ConnectException;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Response;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\InvalidStateException;

class AuthController extends Controller
{
    /**
     * Default OAuth driver when no specific driver is requested.
     */
    private function defaultDriver(): string
    {
        return config('auth.oauth_driver', 'vkid');
    }

    // ────────────────────────────────────────────
    //  Generic provider-agnostic methods
    // ────────────────────────────────────────────

    /**
     * Redirect to the configured OAuth provider.
     */
    public function redirectToProvider(Request $request, ?string $driver = null): RedirectResponse
    {
        $driver = $driver ?? $this->defaultDriver();

        /** @var RedirectResponse $response */
        $response = Socialite::driver($driver)->redirect();

        return $response;
    }

    /**
     * Handle OAuth provider callback.
     *
     * Links accounts by email when a user authenticates via a new provider.
     */
    public function handleProviderCallback(Request $request, ?string $driver = null): RedirectResponse
    {
        $driver = $driver ?? $this->defaultDriver();

        try {
            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = Socialite::driver($driver)->user();

            // 1. Find by provider + provider_id
            $user = User::where('provider', $driver)
                ->where('provider_id', $socialUser->getId())
                ->first();

            // 2. Not found by provider — try email match (account linking)
            if (! $user && $socialUser->getEmail()) {
                $existing = User::where('email', $socialUser->getEmail())->first();
                if ($existing) {
                    // Link new provider to existing account
                    $existing->update([
                        'provider' => $driver,
                        'provider_id' => $socialUser->getId(),
                        'name' => $socialUser->getName() ?? $existing->name,
                        'avatar' => $socialUser->getAvatar() ?? $existing->avatar,
                    ]);
                    $user = $existing;
                }
            }

            // 3. Brand new user
            if (! $user) {
                $user = User::create([
                    'provider' => $driver,
                    'provider_id' => $socialUser->getId(),
                    'name' => $socialUser->getName(),
                    'email' => $socialUser->getEmail(),
                    'avatar' => $socialUser->getAvatar(),
                ]);
            }

            $this->seedDefaultCategories($user);

            Auth::login($user);

            $code = bin2hex(random_bytes(32));

            $user->authCodes()->create([
                'code' => hash('sha256', $code),
                'expires_at' => now()->addSeconds(60),
            ]);

            return redirect(url('/') . '?code=' . $code);

        } catch (InvalidStateException $e) {
            \Log::warning("OAuth ({$driver}): invalid state", ['error' => $e->getMessage()]);
            return redirect('/?error=state_invalid');
        } catch (ClientException $e) {
            \Log::warning("OAuth ({$driver}): access denied or invalid grant", ['error' => $e->getMessage()]);
            return redirect('/?error=access_denied');
        } catch (ConnectException $e) {
            \Log::error("OAuth ({$driver}): network error", ['error' => $e->getMessage()]);
            return redirect('/?error=network_error');
        } catch (\Exception $e) {
            \Log::error("OAuth ({$driver}): " . $e->getMessage());
            return redirect('/?error=auth_failed');
        }
    }

    // ────────────────────────────────────────────
    //  Google OAuth (transitional — delegate to generic methods)
    // ────────────────────────────────────────────

    /**
     * Redirect the user to the Google authentication page.
     *
     * @deprecated Use redirectToProvider for the default provider.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return $this->redirectToProvider(request(), 'google');
    }

    /**
     * Obtain the user information from Google.
     *
     * @deprecated Use handleProviderCallback for the default provider.
     */
    public function handleGoogleCallback(): RedirectResponse
    {
        return $this->handleProviderCallback(request(), 'google');
    }

    // ────────────────────────────────────────────
    //  Dev login
    // ────────────────────────────────────────────

    /**
     * Fast login for development environments.
     */
    public function devLogin(): RedirectResponse
    {
        if (! app()->environment(['local', 'testing'])) {
            abort(404);
        }

        /** @phpstan-ignore-next-line dev-only, config cache irrelevant */
        $devEmail = (string) env('DEV_LOGIN_EMAIL', 'alsokolov2@gmail.com');

        $user = User::firstOrCreate(
            ['email' => $devEmail],
            [
                'name' => 'AlSokolov',
                'provider' => 'dev',
                'provider_id' => 'dev_id_' . md5($devEmail),
                'avatar' => 'https://www.gravatar.com/avatar/' . md5($devEmail) . '?s=200&d=identicon',
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

    // ────────────────────────────────────────────
    //  Token exchange (provider-agnostic — no changes needed)
    // ────────────────────────────────────────────

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
        if (! $user) {
            return response()->json(['message' => 'Invalid or expired code'], 422);
        }

        $token = $user->createToken('auth_token')->plainTextToken;

        // Remove all codes for this user — one-time use
        $user->authCodes()->delete();

        return response()->json(['token' => $token]);
    }

    // ────────────────────────────────────────────
    //  Helpers
    // ────────────────────────────────────────────

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
