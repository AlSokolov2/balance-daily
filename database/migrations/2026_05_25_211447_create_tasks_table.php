<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('tasks', function (Blueprint $table) {
            $table->id();
            $table->string('title');
            $table->string('category_slug');
            $table->decimal('importance', 3, 1)->default(2.0);
            $table->string('subcategory')->nullable();
            $table->dateTime('deadline')->nullable();
            $table->dateTime('postpone_until')->nullable();
            $table->string('repeat_type')->default('none'); // none, interval, weekly
            $table->integer('repeat_interval')->default(1);
            $table->json('repeat_days')->nullable();
            $table->boolean('ha')->default(false);
            $table->boolean('force_active')->default(false);
            $table->text('notes')->nullable();
            $table->boolean('completed')->default(false);
            $table->integer('missed_count')->default(0);
            $table->dateTime('last_completed_date')->nullable();
            $table->dateTime('hidden_until')->nullable();
            $table->dateTime('completed_at')->nullable();
            $table->timestamps();

            $table->foreign('category_slug')->references('slug')->on('categories');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('tasks');
    }
};
