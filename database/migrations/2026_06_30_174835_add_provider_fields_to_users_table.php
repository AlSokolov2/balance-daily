<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('provider', 32)->nullable()->after('id');
            $table->string('provider_id', 255)->nullable()->after('provider');

            $table->unique(['provider', 'provider_id'], 'users_provider_provider_id_unique');
            $table->index('email', 'users_email_index');
        });

        // Migrate existing Google users
        DB::statement('UPDATE users SET provider = ?, provider_id = google_id WHERE google_id IS NOT NULL', ['google']);
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropUnique('users_provider_provider_id_unique');
            $table->dropIndex('users_email_index');
            $table->dropColumn(['provider', 'provider_id']);
        });
    }
};
