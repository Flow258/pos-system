<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Sale;
use App\Models\SaleItem;
use App\Models\Product;
use App\Models\ProductUnit;
use App\Models\Customer;
use App\Models\CreditSession;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SalesController extends Controller
{
    /**
     * Get all sales (paginated).
     *
     * Returns transactions with a `transaction_type` field added to each row:
     *   - "sale"    → cash / gcash / credit purchases
     *   - "payment" → credit repayments (total_amount is stored as negative in DB)
     *
     * The frontend should use `transaction_type` to decide how to display/sum rows.
     */
    public function index(Request $request): JsonResponse
    {
        try {
            $query = Sale::with(['customer', 'saleItems.productUnit.product'])
                ->orderBy('sale_date', 'desc');

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

            // ── Annotate each row so the frontend never has to guess ──────────
            // Also normalise total_amount so it is always a positive number.
            // Payment rows are stored with total_amount < 0 in the DB; we send
            // the absolute value and expose the sign via transaction_type instead.
            $sales->getCollection()->transform(function ($sale) {
                $sale->transaction_type = $sale->payment_method === 'payment'
                    ? 'payment'
                    : 'sale';

                // Always expose a positive amount — direction is encoded in type
                $sale->total_amount = abs((float) $sale->total_amount);

                return $sale;
            });

            return response()->json([
                'success' => true,
                'data'    => $sales,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sales',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get single sale.
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

            $sale->transaction_type = $sale->payment_method === 'payment' ? 'payment' : 'sale';
            $sale->total_amount     = abs((float) $sale->total_amount);

            return response()->json([
                'success' => true,
                'data'    => $sale,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sale',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create a new sale (complete checkout).
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'customer_id'              => 'nullable|exists:customers,id',
                'total_amount'             => 'required|numeric|min:0',
                'amount_paid'              => 'required|numeric|min:0',
                'change_due'               => 'required|numeric',
                'payment_method'           => 'required|string|in:cash,gcash,credit',
                'items'                    => 'required|array|min:1',
                'items.*.product_unit_id'  => 'required|exists:product_units,id',
                'items.*.quantity'         => 'required|integer|min:1',
                'items.*.unit_price'       => 'required|numeric|min:0',
                'items.*.subtotal'         => 'required|numeric|min:0',
            ]);

            DB::beginTransaction();

            $sale = Sale::create([
                'customer_id'    => $validated['customer_id'],
                // Sales are always stored as POSITIVE amounts
                'total_amount'   => $validated['total_amount'],
                'amount_paid'    => $validated['amount_paid'],
                'change_due'     => $validated['change_due'],
                'payment_method' => $validated['payment_method'],
                'sale_date'      => now(),
            ]);

            foreach ($validated['items'] as $itemData) {
                $productUnit = ProductUnit::with('product')->find($itemData['product_unit_id']);

                if (!$productUnit) {
                    throw new \Exception("Product unit not found: {$itemData['product_unit_id']}");
                }

                $baseUnitsToDeduct = $itemData['quantity'] * $productUnit->conversion_factor;

                if ($productUnit->product->stock_quantity < $baseUnitsToDeduct) {
                    throw new \Exception("Insufficient stock for: {$productUnit->product->name}");
                }

                SaleItem::create([
                    'sale_id'         => $sale->id,
                    'product_unit_id' => $productUnit->id,
                    'quantity'        => $itemData['quantity'],
                    'unit_price'      => $itemData['unit_price'],
                    'subtotal'        => $itemData['subtotal'],
                ]);

                $productUnit->product->stock_quantity -= $baseUnitsToDeduct;
                $productUnit->product->save();
            }

            if ($validated['payment_method'] === 'credit' && $validated['customer_id']) {
                $customer = Customer::find($validated['customer_id']);
                if ($customer) {
                    $session = CreditSession::getOrCreateActive($customer);
                    $customer->credit_balance += $validated['total_amount'];
                    $session->addCredit($validated['total_amount']);
                    $customer->save();

                    $sale->credit_session_id = $session->id;
                    $sale->save();
                }
            }

            DB::commit();

            $sale->load(['customer', 'saleItems.productUnit.product']);
            $sale->transaction_type = 'sale';

            return response()->json([
                'success' => true,
                'message' => 'Sale completed successfully',
                'data'    => $sale,
            ], 201);

        } catch (ValidationException $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors'  => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => $e->getMessage(),
                'error'   => config('app.debug') ? $e->getTraceAsString() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete a sale and restore stock + credit balance.
     */
    public function destroy($id): JsonResponse
    {
        try {
            $sale = Sale::with(['saleItems.productUnit.product', 'customer'])->find($id);

            if (!$sale) {
                return response()->json([
                    'success' => false,
                    'message' => 'Sale not found',
                ], 404);
            }

            DB::beginTransaction();

            if ($sale->payment_method === 'credit' && $sale->customer) {
                $customer = $sale->customer;
                // total_amount is positive for credit sales
                $customer->credit_balance -= abs((float) $sale->total_amount);
                if ($customer->credit_balance < 0) {
                    $customer->credit_balance = 0;
                }
                $customer->save();
            }

            foreach ($sale->saleItems as $saleItem) {
                $productUnit = $saleItem->productUnit;
                if ($productUnit && $productUnit->product) {
                    $baseUnitsToRestore = $saleItem->quantity * $productUnit->conversion_factor;
                    $productUnit->product->stock_quantity += $baseUnitsToRestore;
                    $productUnit->product->save();
                }
            }

            $sale->saleItems()->delete();
            $sale->delete();

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Sale deleted successfully. Stock and credit balance restored.',
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error deleting sale',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete all sales for a customer and restore stock + balance.
     *
     * DELETE /api/sales/by-customer/{customerId}
     */
    public function destroyByCustomer($customerId): JsonResponse
    {
        try {
            $customer = Customer::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $sales = Sale::with(['saleItems.productUnit.product'])
                ->where('customer_id', $customerId)
                ->get();

            if ($sales->isEmpty()) {
                return response()->json([
                    'success'       => true,
                    'message'       => 'No sales to delete for this customer.',
                    'deleted_count' => 0,
                ], 200);
            }

            DB::beginTransaction();

            foreach ($sales as $sale) {
                // Only restore stock for actual sales, not payment records
                if ($sale->payment_method !== 'payment') {
                    foreach ($sale->saleItems as $saleItem) {
                        $productUnit = $saleItem->productUnit;
                        if ($productUnit && $productUnit->product) {
                            $baseUnitsToRestore = $saleItem->quantity * $productUnit->conversion_factor;
                            $productUnit->product->stock_quantity += $baseUnitsToRestore;
                            $productUnit->product->save();
                        }
                    }
                }

                $sale->saleItems()->delete();
                $sale->delete();
            }

            $customer->credit_balance = 0;
            $customer->save();

            DB::commit();

            return response()->json([
                'success'       => true,
                'message'       => "All {$sales->count()} sale(s) deleted. Stock restored and credit balance reset.",
                'deleted_count' => $sales->count(),
            ], 200);

        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json([
                'success' => false,
                'message' => 'Error deleting customer sales',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get sales summary for a date or date range.
     *
     * Replaces the old dailySummary() with a unified endpoint that handles
     * both daily and range reports and correctly excludes payment rows.
     *
     * GET /api/sales/summary?date=2025-05-01
     * GET /api/sales/summary?start_date=2025-05-01&end_date=2025-05-31
     */
    public function summary(Request $request): JsonResponse
    {
        try {
            $query = Sale::query();

            // Date filtering — support both single-day and range
            if ($request->has('date')) {
                $query->whereDate('sale_date', $request->date);
                $period = $request->date;
            } else {
                if ($request->has('start_date')) {
                    $query->whereDate('sale_date', '>=', $request->start_date);
                }
                if ($request->has('end_date')) {
                    $query->whereDate('sale_date', '<=', $request->end_date);
                }
                $period = ($request->start_date ?? '?') . ' to ' . ($request->end_date ?? '?');
            }

            // ── Split into sales vs payment rows ──────────────────────────────
            // Payment rows have payment_method = 'payment' and negative total_amount.
            // We use ABS() so arithmetic is correct regardless of how old rows
            // were stored (some may be positive, some negative).
            $salesRows    = (clone $query)->where('payment_method', '!=', 'payment')->get();
            $paymentRows  = (clone $query)->where('payment_method', '=', 'payment')->get();

            $cashSales   = $salesRows->where('payment_method', 'cash')
                                     ->sum(fn($s) => abs((float) $s->total_amount));
            $gcashSales  = $salesRows->where('payment_method', 'gcash')
                                     ->sum(fn($s) => abs((float) $s->total_amount));
            $creditSales = $salesRows->where('payment_method', 'credit')
                                     ->sum(fn($s) => abs((float) $s->total_amount));
            $totalSales  = $cashSales + $gcashSales + $creditSales;

            $totalPayments      = $paymentRows->sum(fn($s) => abs((float) $s->total_amount));
            $salesTransactions  = $salesRows->count();
            $paymentTransactions = $paymentRows->count();

            return response()->json([
                'success' => true,
                'data'    => [
                    'period'               => $period,
                    'total_sales'          => round($totalSales, 2),
                    'cash_sales'           => round($cashSales, 2),
                    'gcash_sales'          => round($gcashSales, 2),
                    'credit_sales'         => round($creditSales, 2),
                    'total_payments'       => round($totalPayments, 2),
                    'sales_transactions'   => $salesTransactions,
                    'payment_transactions' => $paymentTransactions,
                    'average_transaction'  => $salesTransactions > 0
                        ? round($totalSales / $salesTransactions, 2)
                        : 0,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching summary',
                'error'   => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * @deprecated Use summary() instead.
     * Kept for backwards compatibility with any existing callers.
     */
    public function dailySummary(Request $request): JsonResponse
    {
        $request->merge(['date' => $request->date ?? now()->toDateString()]);
        return $this->summary($request);
    }
}