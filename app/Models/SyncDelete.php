<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class SyncDelete extends Model
{
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'model_type',
        'model_id',
        'deleted_at',
    ];

    protected $casts = [
        'deleted_at' => 'datetime',
    ];
}
