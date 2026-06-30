<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\PushSubscriptionController;
use App\Http\Controllers\Api\TaskCompletionController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\StatsController;
use App\Http\Controllers\Api\SyncController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// Public auth endpoint — exchanges one-time code for token (strict rate limit)
Route::post('auth/exchange-code', [AuthController::class, 'exchangeCode'])
    ->middleware('throttle:5,1');

Route::middleware(['auth:sanctum', 'throttle:60,1'])->group(function () {
    // Explicit Category Routes
    Route::get('categories', [CategoryController::class, 'index']);
    Route::post('categories', [CategoryController::class, 'store']);
    Route::get('categories/{id}', [CategoryController::class, 'show']);
    Route::put('categories/{id}', [CategoryController::class, 'update']);
    Route::delete('categories/{id}', [CategoryController::class, 'destroy']);

    // Explicit Task Routes
    Route::get('tasks', [TaskController::class, 'index']);
    Route::post('tasks', [TaskController::class, 'store']);
    Route::get('tasks/{id}', [TaskController::class, 'show']);
    Route::put('tasks/{id}', [TaskController::class, 'update']);
    Route::delete('tasks/{id}', [TaskController::class, 'destroy']);

    Route::post('task-completions', [TaskCompletionController::class, 'store']);
    Route::delete('task-completions/{id}', [TaskCompletionController::class, 'destroy']);

    Route::get('sync', [SyncController::class, 'index']);

    Route::get('settings', [SettingsController::class, 'index']);
    Route::post('settings', [SettingsController::class, 'update']);

    Route::post('push-subscriptions', [PushSubscriptionController::class, 'store']);
    Route::delete('push-subscriptions', [PushSubscriptionController::class, 'destroy']);

    Route::get('stats', [StatsController::class, 'index']);

    Route::get('/user', [AuthController::class, 'me']);
    Route::post('/logout', [AuthController::class, 'logout']);
    Route::post('/auth/link-token', [AuthController::class, 'linkToken']);
});
