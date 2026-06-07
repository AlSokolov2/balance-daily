<?php

namespace App\Http\Controllers;

use App\Models\User;
use Illuminate\Support\Facades\Auth;

abstract class Controller
{
    /**
     * Get the authenticated user or throw an exception.
     *
     * @throws \RuntimeException
     */
    protected function user(): User
    {
        $user = Auth::user();

        if (! $user instanceof User) {
            throw new \RuntimeException('User is not authenticated');
        }

        return $user;
    }
}
