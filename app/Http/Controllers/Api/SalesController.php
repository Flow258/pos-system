<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesController extends Controller
{
    /**
     * Get all sales
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Sale::with(['customer', 'saleItems.productUnit.product'])
                ->orderBy('sale_date', 'desc');

            // Optional filters
            if ($request->has('start_date')) {
                $query->whereDate('sale_date', '>=', $request->start_date);
            }
            if ($request->has('end_date')) {
                $query->whereDate('sale_date', '<=', $request->end_date);
            }
            if ($request->has('customer_id')) {
                $query->where('customer_id', $request->customer_id);
            }

            $sales = $query->paginate($request->per_page ?? 50);

            return response()->json([
                'success' => true,
                'data' => $sales,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sales',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get single sale
     */
    public function show($id): JsonResponse
    {
        try {
            $sale = Sale::with(['customer', 'saleItems.productUnit.product'])->find($id);

            if (!$sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sale not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $sale,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sale',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new sale (Complete checkout)
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_id' => 'nullable|exists:customers,id',
                'total_amount' => 'required|numeric|min:0',
                'amount_paid' => 'required|numeric|min:0',
                'change_due' => 'required|numeric',
                'payment_method' => 'required|string|in:cash,gcash,credit',
                'items' => 'required|array|min:1',
                'items.*.product_unit_id' => 'required|exists:product_units,id',
                'items.*.quantity' => 'required|integer|min:1',
                'items.*.unit_price' => 'required|numeric|min:0',
                'items.*.subtotal' => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            // Create sale
            $sale = Sale::create([
                'customer_id' => $validated['customer_id'],
                'total_amount' => $validated['total_amount'],
                'amount_paid' => $validated['amount_paid'],
                'change_due' => $validated['change_due'],
                'payment_method' => $validated['payment_method'],
                'sale_date' => now(),
            ]);

            // Process each sale item
            foreach ($validated['items'] as $itemData) {
                $productUnit = ProductUnit::with('product')->find($itemData['product_unit_id']);

                if (!$productUnit) {
                    throw new \Exception("Product unit not found: {$itemData['product_unit_id']}");
                }

                // Calculate base units to deduct
                $baseUnitsToDeduct = $itemData['quantity'] * $productUnit->conversion_factor;

                // Check if sufficient stock
                if ($productUnit->product->stock_quantity < $baseUnitsToDeduct) {
                    throw new \Exception("Insufficient stock for: {$productUnit->product->name}");
                }

                // Create sale item
                SaleItem::create([
                    'sale_id' => $sale->id,
                    'product_unit_id' => $productUnit->id,
                    'quantity' => $itemData['quantity'],
                    'unit_price' => $itemData['unit_price'],
                    'subtotal' => $itemData['subtotal'],
                ]);

                // Deduct stock from product
                $productUnit->product->stock_quantity -= $baseUnitsToDeduct;
                $productUnit->product->save();
            }

            // If payment is on credit, add to customer's credit balance
            if ($validated['payment_method'] === 'credit' && $validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $customer->credit_balance += $validated['total_amount'];
                    $customer->save();
                }
            }

            DB::commit();

            // Load relationships for response
            $sale->load(['customer', 'saleItems.productUnit.product']);

            return response()->json([
                'success' => true,
                'message' => 'Sale completed successfully',
                'data' => $sale,
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
                'message' => $e->getMessage(),
                'error' => config('app.debug') ? $e->getTraceAsString() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get daily sales summary
     */
    public function dailySummary(Request $request): JsonResponse
    {
        try {
            $date = $request->date ?? now()->toDateString();

            $sales = Sale::whereDate('sale_date', $date)->get();

            $summary = [
                'date' => $date,
                'total_sales' => $sales->count(),
                'total_amount' => $sales->sum('total_amount'),
                'cash_sales' => $sales->where('payment_method', 'cash')->sum('total_amount'),
                'gcash_sales' => $sales->where('payment_method', 'gcash')->sum('total_amount'),
                'credit_sales' => $sales->where('payment_method', 'credit')->sum('total_amount'),
            ];

            return response()->json([
                'success' => true,
                'data' => $summary,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching summary',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}