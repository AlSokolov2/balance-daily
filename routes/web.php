<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('app');
});

// Добавим fallback для SPA, если будем использовать Vue Router
Route::fallback(function () {
    return view('app');
});
