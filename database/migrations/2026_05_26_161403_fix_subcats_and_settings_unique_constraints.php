<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('subcat_coeffs', function (Blueprint $table) {
            $table->dropUnique('subcat_coeffs_name_unique');
            $table->unique(['name', 'user_id']);
        });

        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique('settings_key_unique');
            $table->unique(['key', 'user_id']);
        });
    }

    public function down(): void
    {
        Schema::table('settings', function (Blueprint $table) {
            $table->dropUnique(['key', 'user_id']);
            $table->unique('key');
        });

        Schema::table('subcat_coeffs', function (Blueprint $table) {
            $table->dropUnique(['name', 'user_id']);
            $table->unique('name');
        });
    }
};
