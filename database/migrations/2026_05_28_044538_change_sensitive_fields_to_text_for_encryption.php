<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->text('title')->change();
            $table->text('subcategory')->nullable()->change();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->text('name')->change();
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->string('title')->change();
            $table->string('subcategory')->nullable()->change();
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->string('name')->change();
        });
    }
};
