<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

Route::get('/auth/google', [AuthController::class, 'redirectToGoogle'])->name('login.google');
Route::get('/auth/google/callback', [AuthController::class, 'handleGoogleCallback'])->name('login.google.callback');

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
