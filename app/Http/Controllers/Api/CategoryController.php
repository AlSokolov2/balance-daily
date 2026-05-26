<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index()
    {
        return Category::all();
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'slug' => 'required|string|unique:categories',
            'name' => 'required|string',
            'weight' => 'required|numeric',
            'color' => 'required|string',
            'hide_until' => 'nullable|string',
        ]);

        return Category::create($validated);
    }

    public function show(Category $category)
    {
        return $category;
    }

    public function update(Request $request, Category $category)
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'weight' => 'sometimes|required|numeric',
            'color' => 'sometimes|required|string',
            'hide_until' => 'nullable|string',
        ]);

        $category->update($validated);

        return $category;
    }

    public function destroy(Category $category)
    {
        $category->delete();

        return response()->noContent();
    }
}
