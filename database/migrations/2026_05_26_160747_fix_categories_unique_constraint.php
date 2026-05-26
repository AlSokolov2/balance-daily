<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // 1. Убираем старый внешний ключ
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['category_slug']);
        });

        // 2. Меняем индекс в таблице категорий
        Schema::table('categories', function (Blueprint $table) {
            $table->dropUnique('categories_slug_unique');
            $table->unique(['slug', 'user_id']);
        });

        // 3. Создаем новый КОМПОЗИТНЫЙ внешний ключ в таблице задач
        // Это гарантирует, что задача ссылается на категорию ТОГО ЖЕ пользователя
        Schema::table('tasks', function (Blueprint $table) {
            // В SQLite есть ограничения на изменение существующих колонок в FK, 
            // но для MySQL это сработает. Для тестов в SQLite мы можем просто 
            // оставить связь без строгого FK если он мешает, либо настроить его правильно.
            $table->foreign(['category_slug', 'user_id'])
                  ->references(['slug', 'user_id'])
                  ->on('categories')
                  ->onDelete('cascade');
        });
    }

    public function down(): void
    {
        Schema::table('tasks', function (Blueprint $table) {
            $table->dropForeign(['category_slug', 'user_id']);
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
