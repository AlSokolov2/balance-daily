<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// Google OAuth (transitional — kept for backward compatibility)
Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('login.google');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('login.google.callback');

// VK ID OAuth (default)
Route::get('/auth/vkid', [AuthController::class, 'redirectToProvider'])->name('login.vkid');
Route::get('/auth/vkid/callback', [AuthController::class, 'handleProviderCallback'])->name('login.vkid.callback');

// OAuth manual linking (from Settings)
Route::get('/auth/{driver}/link', [AuthController::class, 'linkRedirect'])->name('login.link');

if (app()->environment(['local', 'testing'])) {
    Route::get('/auth/dev-login', [AuthController::class, 'devLogin'])->name('login.dev');
}

Route::get('/', function () {
    return view('app');
})->name('home');

// Добавим fallback для SPA
Route::fallback(function () {
    return view('app');
});
