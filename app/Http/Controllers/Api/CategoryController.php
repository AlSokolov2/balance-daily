<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    /**
     * Get all categories for the authenticated user.
     *
     * @param Request $request
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public function index(Request $request)
    {
        return $request->user()->categories;
    }

    /**
     * Create or update a category for the authenticated user.
     *
     * @param Request $request
     * @return \App\Models\Category
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string',
            'name' => 'required|string',
            'weight' => 'required|numeric',
            'color' => 'required|string',
            'hide_until' => 'nullable|string',
        ]);

        return $request->user()->categories()->updateOrCreate(
            ['slug' => $validated['slug']],
            $validated
        );
    }

    /**
     * Get a specific category.
     *
     * @param Request $request
     * @param \App\Models\Category $category
     * @return \App\Models\Category
     */
    public function show(Request $request, Category $category)
    {
        abort_if($category->user_id !== $request->user()->id, 404);
        return $category;
    }

    /**
     * Update a category.
     *
     * @param Request $request
     * @param \App\Models\Category $category
     * @return \App\Models\Category
     */
    public function update(Request $request, Category $category)
    {
        abort_if($category->user_id !== $request->user()->id, 404);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'weight' => 'sometimes|required|numeric',
            'color' => 'sometimes|required|string',
            'hide_until' => 'nullable|string',
        ]);

        $category->update($validated);

        return $category;
    }

    /**
     * Delete a category.
     *
     * @param Request $request
     * @param \App\Models\Category $category
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, Category $category)
    {
        abort_if($category->user_id !== $request->user()->id, 404);
        $category->delete();

        return response()->noContent();
    }
}
