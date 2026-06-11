<?php

namespace Tests\Feature\Api;

use App\Models\User;
use App\Models\Category;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportWeightTest extends TestCase
{
    use RefreshDatabase;

    public function test_import_normalizes_percentage_weights()
    {
        $user = User::factory()->create();

        $data = [
            'categories' => [
                'work' => [
                    'name' => 'Work',
                    'weight' => 50, // Sent as percentage (the bug cause)
                    'color' => '#ff0000'
                ],
                'home' => [
                    'name' => 'Home',
                    'weight' => 0.5, // Sent as decimal (correct format)
                    'color' => '#00ff00'
                ]
            ]
        ];

        $response = $this->actingAs($user)
            ->postJson('/api/import', $data);

        $response->assertStatus(200);

        // Check normalization in database
        $work = Category::where('slug', 'work')->first();
        $home = Category::where('slug', 'home')->first();

        // 50 should become 0.5
        $this->assertEquals(0.5000, (float) $work->weight);
        // 0.5 should stay 0.5
        $this->assertEquals(0.5000, (float) $home->weight);
    }
}
