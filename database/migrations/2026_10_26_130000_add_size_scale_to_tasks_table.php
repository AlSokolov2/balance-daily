<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            // Manual per-task multiplier for the bubble diameter (#197).
            // 1.0 keeps the automatic, priority-based size.
            $table->decimal('size_scale', 3, 2)->default(1.0)->after('importance');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropColumn('size_scale');
        });
    }
};
