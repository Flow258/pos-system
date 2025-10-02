<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ProductUnit;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class ProductLookupController extends Controller
{
    /**
     * Look up a product by barcode.
     * 
     * This is the primary endpoint for the barcode scanner.
     * When a barcode is scanned, this endpoint returns all necessary
     * information to add the item to the shopping cart.
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @example GET /api/units/lookup?barcode=123456789
     * 
     * Success Response:
     * {
     *   "success": true,
     *   "data": {
     *     "id": 1,
     *     "product_id": 1,
     *     "unit_name": "Case",
     *     "barcode": "123456789",
     *     "price": "1200.00",
     *     "price_type": "wholesale",
     *     "conversion_factor": 24,
     *     "product": {
     *       "id": 1,
     *       "name": "Coca-Cola 1.5L",
     *       "description": "1.5 Liter Coca-Cola Bottle",
     *       "category": "Beverages",
     *       "base_unit": "piece",
     *       "stock_quantity": "480.00",
     *       "low_stock_threshold": "50.00",
     *       "is_low_stock": false
     *     }
     *   }
     * }
     * 
     * Error Response (404):
     * {
     *   "success": false,
     *   "message": "Product not found with barcode: 123456789"
     * }
     */
    public function lookupByBarcode(Request $request): JsonResponse
    {
        try {
            // Validate the incoming request
            $validated = $request->validate([
                'barcode' => 'required|string|max:100',
            ]);

            $barcode = $validated['barcode'];

            // Query the ProductUnit by barcode with eager loading of the parent Product
            // This prevents N+1 query problems and loads all needed data in one query
            $productUnit = ProductUnit::with('product')
                ->where('barcode', $barcode)
                ->first();

            // Handle case where barcode is not found
            if (!$productUnit) {
                return response()->json([
                    'success' => false,
                    'message' => "Product not found with barcode: {$barcode}",
                ], 404);
            }

            // Check if product has sufficient stock
            // Calculate required base units: quantity (1) × conversion_factor
            $requiredBaseUnits = $productUnit->conversion_factor;
            $hasStock = $productUnit->product->stock_quantity >= $requiredBaseUnits;

            // Build the response with all necessary information
            $response = [
                'success' => true,
                'data' => [
                    // ProductUnit information
                    'id' => $productUnit->id,
                    'product_id' => $productUnit->product_id,
                    'unit_name' => $productUnit->unit_name,
                    'barcode' => $productUnit->barcode,
                    'price' => number_format($productUnit->price, 2, '.', ''),
                    'price_type' => $productUnit->price_type,
                    'conversion_factor' => $productUnit->conversion_factor,
                    
                    // Parent Product information
                    'product' => [
                        'id' => $productUnit->product->id,
                        'name' => $productUnit->product->name,
                        'description' => $productUnit->product->description,
                        'category' => $productUnit->product->category,
                        'base_unit' => $productUnit->product->base_unit,
                        'stock_quantity' => number_format($productUnit->product->stock_quantity, 2, '.', ''),
                        'low_stock_threshold' => number_format($productUnit->product->low_stock_threshold, 2, '.', ''),
                        'is_low_stock' => $productUnit->product->isLowStock(),
                    ],
                    
                    // Stock availability for this specific unit
                    'stock_info' => [
                        'has_stock' => $hasStock,
                        'available_units' => floor($productUnit->product->stock_quantity / $productUnit->conversion_factor),
                        'required_base_units' => $requiredBaseUnits,
                    ],
                ],
            ];

            return response()->json($response, 200);

        } catch (ValidationException $e) {
            // Handle validation errors
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            // Handle unexpected errors
            // In production, you might want to log this error
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while looking up the product',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Search products by name or barcode (optional enhancement).
     * 
     * This can be useful for manual product lookup when barcode
     * scanner is not available or barcode is damaged.
     * 
     * @param Request $request
     * @return JsonResponse
     * 
     * @example GET /api/units/search?query=coca
     */
    public function search(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'query' => 'required|string|min:2|max:100',
                'limit' => 'nullable|integer|min:1|max:50',
            ]);

            $query = $validated['query'];
            $limit = $validated['limit'] ?? 10;

            // Search in both ProductUnit barcodes and Product names
            $results = ProductUnit::with('product')
                ->where('barcode', 'LIKE', "%{$query}%")
                ->orWhereHas('product', function ($q) use ($query) {
                    $q->where('name', 'LIKE', "%{$query}%");
                })
                ->limit($limit)
                ->get();

            return response()->json([
                'success' => true,
                'data' => $results,
                'count' => $results->count(),
            ], 200);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'An error occurred while searching products',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}