<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        if (!Schema::hasTable('sync_deletes')) {
            Schema::create('sync_deletes', function (Blueprint $table) {
                $table->id();
                $table->foreignId('user_id')->constrained()->onDelete('cascade');
                $table->string('model_type'); // 'task' or 'category'
                $table->unsignedBigInteger('model_id');
                $table->timestamp('deleted_at');
                
                $table->index(['user_id', 'deleted_at']);
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sync_deletes');
    }
};
