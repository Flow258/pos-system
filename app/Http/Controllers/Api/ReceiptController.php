<?php

namespace App\Http\Controllers\Api;

use App\Models\Receipt;
use Illuminate\Http\Request;

class ReceiptController extends Controller
{
    // Save a new receipt and return it
    public function store(Request $request)
    {
        $request->validate([
            'items'          => 'required|array|min:1',
            'items.*.name'   => 'required|string',
            'items.*.qty'    => 'required|integer|min:1',
            'items.*.price'  => 'required|numeric|min:0',
            'total'          => 'required|numeric|min:0',
            'payment_method' => 'required|in:cash,gcash',
            'cash_tendered'  => 'nullable|numeric|min:0',
        ]);

        // Calculate fields
        $subtotal = collect($request->items)->sum(fn($i) => $i['qty'] * $i['price']);
        $discount = $subtotal - $request->total;
        $change   = max(0, ($request->cash_tendered ?? 0) - $request->total);

        $receipt = Receipt::create([
            'receipt_number' => Receipt::generateNumber(),
            'items'          => $request->items,
            'subtotal'       => $subtotal,
            'discount'       => $discount,
            'total'          => $request->total,
            'cash_tendered'  => $request->cash_tendered ?? 0,
            'change'         => $change,
            'payment_method' => $request->payment_method,
            'status'         => 'paid',
        ]);

        return response()->json($receipt, 201);
    }

    // Get a single receipt by ID
    public function show(Receipt $receipt)
    {
        return response()->json($receipt);
    }

    // List all receipts (for history)
    public function index()
    {
        return response()->json(
            Receipt::latest()->paginate(20)
        );
    }
}