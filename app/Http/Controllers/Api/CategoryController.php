<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Category;
use Illuminate\Http\Request;

class CategoryController extends Controller
{
    public function index(Request $request)
    {
        return $request->user()->categories;
    }

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

    public function show(Request $request, $id)
    {
        return $request->user()->categories()->findOrFail($id);
    }

    public function update(Request $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);
        
        $validated = $request->validate([
            'name' => 'sometimes|required|string',
            'weight' => 'sometimes|required|numeric',
            'color' => 'sometimes|required|string',
            'hide_until' => 'nullable|string',
        ]);

        $category->update($validated);

        return $category;
    }

    public function destroy(Request $request, $id)
    {
        $category = $request->user()->categories()->findOrFail($id);
        $category->delete();

        return response()->noContent();
    }
}
