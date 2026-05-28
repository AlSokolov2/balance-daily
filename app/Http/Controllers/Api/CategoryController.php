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
     * @param int $category
     * @return \App\Models\Category
     */
    public function show(Request $request, $category)
    {
        return $request->user()->categories()->findOrFail($category);
    }

    /**
     * Update a category.
     *
     * @param Request $request
     * @param int $category
     * @return \App\Models\Category
     */
    public function update(Request $request, $category)
    {
        $categoryModel = $request->user()->categories()->findOrFail($category);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'weight' => 'sometimes|required|numeric',
            'color' => 'sometimes|required|string',
            'hide_until' => 'nullable|string',
        ]);

        $categoryModel->update($validated);

        return $categoryModel;
    }

    /**
     * Delete a category.
     *
     * @param Request $request
     * @param int $category
     * @return \Illuminate\Http\Response
     */
    public function destroy(Request $request, $category)
    {
        $categoryModel = $request->user()->categories()->findOrFail($category);
        $categoryModel->delete();

        return response()->noContent();
    }
}
