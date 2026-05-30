<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Task extends Model
{
    use HasFactory;
    protected $fillable = [
        'user_id',
        'title',
        'category_slug',
        'importance',
        'subcategory',
        'deadline',
        'postpone_until',
        'repeat_type',
        'repeat_interval',
        'repeat_days',
        'ha',
        'force_active',
        'notes',
        'completed',
        'missed_count',
        'last_completed_date',
        'hidden_until',
        'completed_at',
    ];

    protected $casts = [
        'title' => 'encrypted',
        'notes' => 'encrypted',
        'subcategory' => 'encrypted',
        'repeat_days' => 'array',
        'ha' => 'boolean',
        'force_active' => 'boolean',
        'completed' => 'boolean',
        'deadline' => 'datetime',
        'postpone_until' => 'datetime',
        'last_completed_date' => 'datetime',
        'hidden_until' => 'datetime',
        'completed_at' => 'datetime',
    ];

    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_slug', 'slug');
    }
}
