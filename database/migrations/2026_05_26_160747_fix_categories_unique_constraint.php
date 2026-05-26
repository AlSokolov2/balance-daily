<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Убираем внешний ключ из таблицы задач
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['category_slug']);
        });

        // 2. Меняем индекс в таблице категорий
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_slug_unique');
            $table->unique(['slug', 'user_id']);
        });

        // 3. Возвращаем внешний ключ (связь теперь будет работать внутри контекста пользователя)
        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('category_slug')->references('slug')->on('categories');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['category_slug']);
        });

        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique(['slug', 'user_id']);
            $table->unique('slug');
        });

        Schema::table('tasks', function (Blueprint $table) {
            $table->foreign('category_slug')->references('slug')->on('categories');
        });
    }
};
