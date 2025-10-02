<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Product;
use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class ProductController extends Controller
{
    /**
     * Get all products with their units
     */
    public function index(): JsonResponse
    {
        try {
            $products = Product::with('productUnits')->orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data' => $products,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching products',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get single product
     */
    public function show($id): JsonResponse
    {
        try {
            $product = Product::with('productUnits')->find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $product,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching product',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new product with units
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'stock_quantity' => 'required|numeric|min:0',
                'low_stock_threshold' => 'nullable|numeric|min:0',
                'units' => 'required|array|min:1',
                'units.*.unit_name' => 'required|string|max:50',
                'units.*.barcode' => 'required|string|max:100|unique:product_units,barcode',
                'units.*.price' => 'required|numeric|min:0',
                'units.*.price_type' => 'required|in:retail,wholesale',
                'units.*.conversion_factor' => 'required|integer|min:1',
            ]);

            DB::beginTransaction();

            // Create product
            $product = Product::create([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'] ?? null,
                'stock_quantity' => $validated['stock_quantity'],
                'low_stock_threshold' => $validated['low_stock_threshold'] ?? 10,
            ]);

            // Create product units
            foreach ($validated['units'] as $unitData) {
                ProductUnit::create([
                    'product_id' => $product->id,
                    'unit_name' => $unitData['unit_name'],
                    'barcode' => $unitData['barcode'],
                    'price' => $unitData['price'],
                    'price_type' => $unitData['price_type'],
                    'conversion_factor' => $unitData['conversion_factor'],
                ]);
            }

            DB::commit();

            $product->load('productUnits');

            return response()->json([
                'success' => true,
                'message' => 'Product created successfully',
                'data' => $product,
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error creating product',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update product and units
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found',
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:255',
                'description' => 'nullable|string',
                'category' => 'nullable|string|max:100',
                'stock_quantity' => 'required|numeric|min:0',
                'low_stock_threshold' => 'nullable|numeric|min:0',
                'units' => 'required|array|min:1',
                'units.*.id' => 'nullable|exists:product_units,id',
                'units.*.unit_name' => 'required|string|max:50',
                'units.*.barcode' => 'required|string|max:100',
                'units.*.price' => 'required|numeric|min:0',
                'units.*.price_type' => 'required|in:retail,wholesale',
                'units.*.conversion_factor' => 'required|integer|min:1',
            ]);

            DB::beginTransaction();

            // Update product
            $product->update([
                'name' => $validated['name'],
                'description' => $validated['description'] ?? null,
                'category' => $validated['category'] ?? null,
                'stock_quantity' => $validated['stock_quantity'],
                'low_stock_threshold' => $validated['low_stock_threshold'] ?? 10,
            ]);

            // Get existing unit IDs
            $existingUnitIds = $product->productUnits->pluck('id')->toArray();
            $updatedUnitIds = [];

            // Update or create units
            foreach ($validated['units'] as $unitData) {
                if (isset($unitData['id'])) {
                    // Update existing unit
                    $unit = ProductUnit::find($unitData['id']);
                    if ($unit && $unit->product_id === $product->id) {
                        $unit->update([
                            'unit_name' => $unitData['unit_name'],
                            'barcode' => $unitData['barcode'],
                            'price' => $unitData['price'],
                            'price_type' => $unitData['price_type'],
                            'conversion_factor' => $unitData['conversion_factor'],
                        ]);
                        $updatedUnitIds[] = $unit->id;
                    }
                } else {
                    // Create new unit
                    $newUnit = ProductUnit::create([
                        'product_id' => $product->id,
                        'unit_name' => $unitData['unit_name'],
                        'barcode' => $unitData['barcode'],
                        'price' => $unitData['price'],
                        'price_type' => $unitData['price_type'],
                        'conversion_factor' => $unitData['conversion_factor'],
                    ]);
                    $updatedUnitIds[] = $newUnit->id;
                }
            }

            // Delete units that were removed
            $unitsToDelete = array_diff($existingUnitIds, $updatedUnitIds);
            if (!empty($unitsToDelete)) {
                ProductUnit::whereIn('id', $unitsToDelete)->delete();
            }

            DB::commit();

            $product->load('productUnits');

            return response()->json([
                'success' => true,
                'message' => 'Product updated successfully',
                'data' => $product,
            ], 200);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error updating product',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete product
     */
    public function destroy($id): JsonResponse
    {
        try {
            $product = Product::find($id);

            if (!$product) {
                return response()->json([
                    'success' => false,
                    'message' => 'Product not found',
                ], 404);
            }

            $product->delete();

            return response()->json([
                'success' => true,
                'message' => 'Product deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting product',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}