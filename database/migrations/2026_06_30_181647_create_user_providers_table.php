<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('user_providers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->string('provider', 32);
            $table->string('provider_id', 255);
            $table->string('email')->nullable();
            $table->text('token')->nullable();
            $table->text('refresh_token')->nullable();
            $table->timestamp('created_at')->useCurrent();

            $table->unique(['provider', 'provider_id'], 'user_providers_provider_provider_id_unique');
            $table->unique(['user_id', 'provider'], 'user_providers_user_id_provider_unique');
            $table->index('email');
        });

        // Migrate existing data from users table
        $existingUsers = DB::table('users')
            ->whereNotNull('provider')
            ->whereNotNull('provider_id')
            ->get();

        foreach ($existingUsers as $u) {
            DB::table('user_providers')->insert([
                'user_id' => $u->id,
                'provider' => $u->provider,
                'provider_id' => $u->provider_id,
                'token' => $u->google_token,
                'refresh_token' => $u->google_refresh_token,
                'created_at' => now(),
            ]);
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('user_providers');
    }
};
