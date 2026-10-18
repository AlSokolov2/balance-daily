<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\SubcatCoeff;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class SubcatCoeffController extends Controller
{
    /**
     * Update the user's subcategory coefficients (bulk upsert).
     *
     * The settings screen edits every visible coefficient at once, so the client
     * sends the whole map. Names omitted from the payload are left untouched.
     *
     * @return Collection<int|string, mixed>
     */
    public function update(Request $request): Collection
    {
        $validated = $request->validate([
            'coefficients' => 'required|array',
            'coefficients.*' => 'numeric|between:0.5,4',
        ]);

        $user = $this->user();

        foreach ($validated['coefficients'] as $name => $coefficient) {
            $user->subcatCoeffs()->updateOrCreate(
                ['name' => $name],
                ['coefficient' => $coefficient]
            );
        }

        return SubcatCoeff::where('user_id', $user->id)->pluck('coefficient', 'name');
    }
}
