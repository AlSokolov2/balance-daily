<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;

class InitialDataSeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            ['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.13, 'color' => '#ff3b30'],
            ['slug' => 'prog', 'name' => 'PROG', 'weight' => 0.46, 'color' => '#34c759'],
            ['slug' => 'chin', 'name' => 'CHIN', 'weight' => 0.38, 'color' => '#007aff'],
            ['slug' => 'hobb', 'name' => 'HOBB', 'weight' => 0.03, 'color' => '#ffcc00'],
            ['slug' => '__archive__', 'name' => 'Архив', 'weight' => 0.01, 'color' => '#8e8e93'],
        ];

        foreach ($categories as $cat) {
            Category::updateOrCreate(['slug' => $cat['slug']], $cat);
        }
    }
}
