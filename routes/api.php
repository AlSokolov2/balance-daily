<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\CategoryController;
use App\Http\Controllers\Api\TaskController;
use App\Http\Controllers\Api\SettingsController;
use App\Http\Controllers\Api\ImportExportController;

Route::apiResource('categories', CategoryController::class);
Route::apiResource('tasks', TaskController::class);

Route::get('settings', [SettingsController::class, 'index']);
Route::post('settings', [SettingsController::class, 'update']);

Route::get('export', [ImportExportController::class, 'export']);
Route::post('import', [ImportExportController::class, 'import']);
