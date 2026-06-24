<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\Request;
use Illuminate\Http\Response;

class CategoryController extends Controller
{
    /**
     * Get all categories for the authenticated user.
     *
     * @return Collection<int, Category>
     */
    public function index(Request $request): Collection
    {
        return $this->user()->categories;
    }

    /**
     * Create or update a category for the authenticated user.
     */
    public function store(Request $request): Category
    {
        $validated = $request->validate([
            'slug' => 'required|string',
            'name' => 'required|string',
            'weight' => 'required|numeric',
            'color' => 'required|string',
            'hide_until' => 'nullable|date_format:H:i',
        ]);

        /** @var Category $category */
        $category = $this->user()->categories()->updateOrCreate(
            ['slug' => $validated['slug']],
            $validated
        );

        return $category;
    }

    /**
     * Get a specific category.
     */
    public function show(Request $request, string $id): Category
    {
        /** @var Category $category */
        $category = $this->user()->categories()->findOrFail($id);

        return $category;
    }

    /**
     * Update a category.
     */
    public function update(Request $request, string $id): Category
    {
        /** @var Category $category */
        $category = $this->user()->categories()->findOrFail($id);

        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'weight' => 'sometimes|required|numeric',
            'color' => 'sometimes|required|string',
            'hide_until' => 'nullable|date_format:H:i',
        ]);

        $category->update($validated);

        return $category;
    }

    /**
     * Delete a category.
     */
    public function destroy(Request $request, string $id): Response
    {
        /** @var Category $category */
        $category = $this->user()->categories()->findOrFail($id);
        $category->delete();

        return response()->noContent();
    }
}
