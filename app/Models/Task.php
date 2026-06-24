<?php

namespace App\Models;

use Database\Factories\TaskFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Task extends Model
{
    /** @use HasFactory<TaskFactory> */
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
        'reminder_times',
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
        'reminder_times' => 'array',
        'ha' => 'boolean',
        'force_active' => 'boolean',
        'completed' => 'boolean',
        'deadline' => 'datetime',
        'postpone_until' => 'datetime',
        'last_completed_date' => 'datetime',
        'hidden_until' => 'datetime',
        'completed_at' => 'datetime',
    ];

    /** @return BelongsTo<Category, $this> */
    public function category(): BelongsTo
    {
        return $this->belongsTo(Category::class, 'category_slug', 'slug');
    }

    /**
     * Get the completion history for the task.
     * @return HasMany<TaskCompletion, $this>
     */
    public function completions(): HasMany
    {
        return $this->hasMany(TaskCompletion::class);
    }

    /**
     * Get the latest completion record.
     * @return HasOne<TaskCompletion, $this>
     */
    public function latestCompletion(): HasOne
    {
        return $this->hasOne(TaskCompletion::class)->latestOfMany('completed_at');
    }
}
