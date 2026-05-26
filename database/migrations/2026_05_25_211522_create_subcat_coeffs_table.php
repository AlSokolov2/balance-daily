<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('subcat_coeffs', function (Blueprint $table) {
            $table->id();
            $table->string('name')->unique();
            $table->decimal('coefficient', 5, 4)->default(1.0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('subcat_coeffs');
    }
};
