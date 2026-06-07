<?php

namespace App\Observers;

use App\Models\Category;
use App\Models\SyncDelete;
use App\Models\Task;
use Illuminate\Database\Eloquent\Model;

class SyncObserver
{
    /**
     * Handle the Model "deleted" event.
     */
    public function deleted(Model $model): void
    {
        /** @var Task|Category $model */
        SyncDelete::create([
            'user_id' => $model->user_id,
            'model_type' => strtolower(class_basename($model)),
            'model_id' => $model->id,
            'deleted_at' => now(),
        ]);
    }
}
