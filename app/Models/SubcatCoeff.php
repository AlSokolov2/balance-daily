<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SubcatCoeff extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'coefficient',
    ];

    protected $casts = [
        'coefficient' => 'float',
    ];
}
