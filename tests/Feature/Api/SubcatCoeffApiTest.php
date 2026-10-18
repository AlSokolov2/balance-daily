<?php

namespace Tests\Feature\Api;

use App\Models\SubcatCoeff;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubcatCoeffApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_update_subcategory_coefficients(): void
    {
        $user = User::factory()->create();
        SubcatCoeff::create(['user_id' => $user->id, 'name' => 'coding', 'coefficient' => 1.0]);

        $response = $this->actingAs($user)->putJson('/api/subcat-coeffs', [
            'coefficients' => ['coding' => 2.5],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('coding', 2.5);

        $this->assertDatabaseHas('subcat_coeffs', [
            'user_id' => $user->id,
            'name' => 'coding',
            'coefficient' => 2.5,
        ]);
    }

    public function test_omitted_coefficients_are_left_untouched(): void
    {
        $user = User::factory()->create();
        SubcatCoeff::create(['user_id' => $user->id, 'name' => 'coding', 'coefficient' => 1.0]);
        SubcatCoeff::create(['user_id' => $user->id, 'name' => 'meetings', 'coefficient' => 1.5]);

        $response = $this->actingAs($user)->putJson('/api/subcat-coeffs', [
            'coefficients' => ['coding' => 3.0],
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('coding', 3)
            ->assertJsonPath('meetings', 1.5);
    }

    public function test_coefficients_are_scoped_to_the_authenticated_user(): void
    {
        $owner = User::factory()->create();
        $other = User::factory()->create();
        SubcatCoeff::create(['user_id' => $owner->id, 'name' => 'coding', 'coefficient' => 1.0]);
        SubcatCoeff::create(['user_id' => $other->id, 'name' => 'coding', 'coefficient' => 2.0]);

        $this->actingAs($owner)->putJson('/api/subcat-coeffs', [
            'coefficients' => ['coding' => 4.0],
        ])->assertStatus(200);

        $this->assertDatabaseHas('subcat_coeffs', [
            'user_id' => $owner->id,
            'name' => 'coding',
            'coefficient' => 4.0,
        ]);
        $this->assertDatabaseHas('subcat_coeffs', [
            'user_id' => $other->id,
            'name' => 'coding',
            'coefficient' => 2.0,
        ]);
    }

    public function test_out_of_range_coefficient_is_rejected(): void
    {
        $user = User::factory()->create();
        SubcatCoeff::create(['user_id' => $user->id, 'name' => 'coding', 'coefficient' => 1.0]);

        $response = $this->actingAs($user)->putJson('/api/subcat-coeffs', [
            'coefficients' => ['coding' => 10],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['coefficients.coding']);

        $this->assertDatabaseHas('subcat_coeffs', [
            'user_id' => $user->id,
            'name' => 'coding',
            'coefficient' => 1.0,
        ]);
    }

    public function test_non_numeric_coefficient_is_rejected(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)->putJson('/api/subcat-coeffs', [
            'coefficients' => ['coding' => 'high'],
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['coefficients.coding']);
    }
}
