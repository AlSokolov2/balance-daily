<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Category extends Model
{
    protected $fillable = [
        'slug',
        'name',
        'weight',
        'color',
        'hide_until',
    ];

    public function tasks(): HasMany
    {
        return $this->hasMany(Task::class, 'category_slug', 'slug');
    }
}
