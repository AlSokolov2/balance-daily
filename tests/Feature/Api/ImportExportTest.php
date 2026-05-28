<?php

namespace Tests\Feature\Api;

use App\Models\Category;
use App\Models\Task;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ImportExportTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_export_data(): void
    {
        $user = User::factory()->create();
        Category::create(['slug' => 'chor', 'name' => 'CHOR', 'weight' => 0.13, 'user_id' => $user->id]);
        Task::create(['title' => 'Test Task', 'category_slug' => 'chor', 'importance' => 2, 'user_id' => $user->id]);

        $response = $this->actingAs($user)->getJson('/api/export');

        $response->assertStatus(200)
                 ->assertJsonStructure(['tasks', 'categories', 'subcatCoeffs', 'notepad'])
                 ->assertJsonPath('tasks.0.title', 'Test Task');
    }

    public function test_user_can_import_legacy_data(): void
    {
        $user = User::factory()->create();
        
        $legacyData = [
            'categories' => [
                'work' => ['name' => 'Work', 'weight' => 0.5, 'color' => '#000000']
            ],
            'tasks' => [
                ['title' => 'Legacy Task', 'category' => 'work', 'importance' => 4]
            ],
            'subcatCoeffs' => [
                'Urgent' => 1.5
            ],
            'notepad' => 'Hello World'
        ];

        $response = $this->actingAs($user)->postJson('/api/import', $legacyData);

        $response->assertStatus(200);
        
        $this->assertDatabaseHas('categories', ['slug' => 'work', 'user_id' => $user->id]);
        $this->assertEquals('Legacy Task', Task::where('user_id', $user->id)->first()->title);
        $this->assertDatabaseHas('subcat_coeffs', ['name' => 'Urgent', 'coefficient' => 1.5, 'user_id' => $user->id]);
        $this->assertEquals('Hello World', \App\Models\Setting::where('user_id', $user->id)->where('key', 'notepad_text')->first()->value);
    }
}
