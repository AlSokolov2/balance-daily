<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuthCode;
use App\Models\User;
use App\Models\UserProvider;
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
     * Default OAuth driver.
     */
    private function defaultDriver(): string
    {
        return config('auth.oauth_driver', 'vkid');
    }

    // ────────────────────────────────────────────
    //  Generic provider-agnostic redirect
    // ────────────────────────────────────────────

    /**
     * Redirect to an OAuth provider.
     */
    public function redirectToProvider(Request $request, ?string $driver = null): RedirectResponse
    {
        $driver = $driver ?? $this->defaultDriver();

        /** @var RedirectResponse $response */
        $response = Socialite::driver($driver)->redirect();

        return $response;
    }

    // ────────────────────────────────────────────
    //  Generic OAuth callback
    // ────────────────────────────────────────────

    /**
     * Handle OAuth provider callback.
     *
     * Three outcomes for normal login:
     *   1. Identity found in user_providers → login
     *   2. Identity not found, email matches existing user → auto-link → login
     *   3. Identity not found, email unknown → create new user + provider → login
     *
     * When session has oauth_link_user_id (set by linkRedirect),
     * the provider is manually linked to that user.
     */
    public function handleProviderCallback(Request $request, ?string $driver = null): RedirectResponse
    {
        $driver = $driver ?? $this->defaultDriver();

        try {
            /** @var \Laravel\Socialite\Two\User $socialUser */
            $socialUser = Socialite::driver($driver)->user();

            // ── Intent: link provider from session (set by linkRedirect) ──
            $linkUserId = session()->pull('oauth_link_user_id');
            session()->pull('oauth_link_driver');

            if ($linkUserId) {
                /** @var User|null $currentUser */
                $currentUser = User::find($linkUserId);

                if (! $currentUser) {
                    return redirect('/?error=link_user_not_found');
                }

                // Check if this provider identity belongs to another user
                $existingProvider = UserProvider::where('provider', $driver)
                    ->where('provider_id', $socialUser->getId())
                    ->first();

                if ($existingProvider && $existingProvider->user_id !== $currentUser->id) {
                    // Identity belongs to another user — migrate to the data owner.
                    // The current (VK) user is merged into the existing (Google) user
                    // that holds the actual tasks/categories/history.
                    /** @var User $dataOwner */
                    $dataOwner = User::find($existingProvider->user_id);

                    if ($dataOwner) {
                        // Move VK provider from current user to data owner
                        UserProvider::where('user_id', $currentUser->id)
                            ->where('provider', $this->defaultDriver())
                            ->update(['user_id' => $dataOwner->id]);

                        // Move any tasks/categories/settings from current to data owner
                        $currentUser->tasks()->update(['user_id' => $dataOwner->id]);
                        $currentUser->categories()->update(['user_id' => $dataOwner->id]);
                        $currentUser->settings()->update(['user_id' => $dataOwner->id]);
                        $currentUser->subcatCoeffs()->update(['user_id' => $dataOwner->id]);

                        // VK email becomes primary
                        if ($socialUser->getEmail()) {
                            $dataOwner->update([
                                'email' => $socialUser->getEmail(),
                                'name' => $dataOwner->name ?? $currentUser->name,
                                'avatar' => $dataOwner->avatar ?? $currentUser->avatar,
                            ]);
                        }

                        // Delete empty current user
                        $currentUser->delete();

                        $currentUser = $dataOwner;

                        \Log::info("OAuth ({$driver}): merged user {$linkUserId} into {$dataOwner->id}");
                    }
                }

                // Link/update this provider for the resolved user
                UserProvider::updateOrCreate(
                    ['user_id' => $currentUser->id, 'provider' => $driver],
                    [
                        'provider_id' => $socialUser->getId(),
                        'email' => $socialUser->getEmail(),
                        'token' => $socialUser->token,
                        'refresh_token' => $socialUser->refreshToken,
                    ]
                );

                // Link provider becomes primary email
                if ($socialUser->getEmail()) {
                    $currentUser->update(['email' => $socialUser->getEmail()]);
                }

                Auth::login($currentUser);

                $code = bin2hex(random_bytes(32));
                $currentUser->authCodes()->create([
                    'code' => hash('sha256', $code),
                    'expires_at' => now()->addSeconds(60),
                ]);

                return redirect(url('/') . '?code=' . $code);
            }

            // ── Normal login flow ──

            // 1. Find by provider + provider_id in user_providers
            $providerIdentity = UserProvider::where('provider', $driver)
                ->where('provider_id', $socialUser->getId())
                ->first();

            if ($providerIdentity) {
                $user = $providerIdentity->user;
            } else {
                // 2. Try email match — auto-link
                $user = null;
                if ($socialUser->getEmail()) {
                    $user = User::where('email', $socialUser->getEmail())->first();
                    if ($user) {
                        // Auto-link: add this provider to the existing user
                        $user->providers()->create([
                            'provider' => $driver,
                            'provider_id' => $socialUser->getId(),
                            'email' => $socialUser->getEmail(),
                            'token' => $socialUser->token,
                            'refresh_token' => $socialUser->refreshToken,
                        ]);
                        \Log::info("OAuth ({$driver}): auto-linked to existing user {$user->id} by email");
                    }
                }

                // 3. Brand new user
                if (! $user) {
                    $user = User::create([
                        'name' => $socialUser->getName(),
                        'email' => $socialUser->getEmail(),
                        'avatar' => $socialUser->getAvatar(),
                    ]);

                    $user->providers()->create([
                        'provider' => $driver,
                        'provider_id' => $socialUser->getId(),
                        'email' => $socialUser->getEmail(),
                        'token' => $socialUser->token,
                        'refresh_token' => $socialUser->refreshToken,
                    ]);

                    $this->seedDefaultCategories($user);
                } else {
                    // Update existing user's name/avatar if not set
                    $user->update([
                        'name' => $user->name ?? $socialUser->getName(),
                        'avatar' => $user->avatar ?? $socialUser->getAvatar(),
                    ]);
                }
            }

            /** @var User $user */
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
    //  Manual provider linking (from Settings)
    // ────────────────────────────────────────────

    /**
     * Generate a one-time redirect URL for linking a new OAuth provider
     * to the currently authenticated user.
     */
    public function linkToken(Request $request): JsonResponse
    {
        $userId = $this->user()->id;
        $token = bin2hex(random_bytes(24));

        cache(['auth_link_' . $token => $userId], 300); // 5 min TTL

        $driver = $request->input('provider', $this->defaultDriver());

        return response()->json([
            'url' => url("/auth/{$driver}/link?token={$token}"),
        ]);
    }

    /**
     * Initiate OAuth for provider linking. Resolves the user from a
     * temporary token and stores the intent in the session.
     */
    public function linkRedirect(Request $request, ?string $driver = null): RedirectResponse
    {
        $driver = $driver ?? $this->defaultDriver();
        $token = $request->query('token');

        if (! $token) {
            return redirect('/?error=missing_token');
        }

        $userId = cache('auth_link_' . $token);

        if (! $userId) {
            return redirect('/?error=invalid_or_expired_token');
        }

        // Consume the token
        cache()->forget('auth_link_' . $token);

        // Store linking intent in session for the callback
        session()->put('oauth_link_driver', $driver);
        session()->put('oauth_link_user_id', $userId);

        /** @var RedirectResponse $response */
        $response = Socialite::driver($driver)->redirect();

        return $response;
    }

    // ────────────────────────────────────────────
    //  Google OAuth (transitional wrappers)
    // ────────────────────────────────────────────

    /**
     * @deprecated Use redirectToProvider for the default provider.
     */
    public function redirectToGoogle(): RedirectResponse
    {
        return $this->redirectToProvider(request(), 'google');
    }

    /**
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
                'avatar' => 'https://www.gravatar.com/avatar/' . md5($devEmail) . '?s=200&d=identicon',
            ]
        );

        // Ensure dev provider identity exists
        $user->providers()->firstOrCreate(
            ['provider' => 'dev'],
            ['provider_id' => 'dev_id_' . md5($devEmail)]
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
    //  Token exchange (provider-agnostic)
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
        /** @var User $user */
        $user = $this->user();
        $user->load('providers');

        return $user;
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
