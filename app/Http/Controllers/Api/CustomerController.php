<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException;

class CustomerController extends Controller
{
    /**
     * Get all customers
     */
    public function index(): JsonResponse
    {
        try {
            $customers = Customer::orderBy('name')->get();

            return response()->json([
                'success' => true,
                'data' => $customers,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customers',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get single customer
     */
    public function show($id): JsonResponse
    {
        try {
            $customer = Customer::with('sales')->find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            return response()->json([
                'success' => true,
                'data' => $customer,
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Create new customer
     */
    public function store(Request $request): JsonResponse
    {
        try {
            $validated = $request->validate([
                'name' => 'required|string|max:150',
                'phone_number' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'credit_balance' => 'nullable|numeric|min:0',
            ]);

            $customer = Customer::create($validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer created successfully',
                'data' => $customer,
            ], 201);

        } catch (ValidationException $e) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error creating customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Update customer
     */
    public function update(Request $request, $id): JsonResponse
    {
        try {
            $customer = Customer::find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $validated = $request->validate([
                'name' => 'required|string|max:150',
                'phone_number' => 'nullable|string|max:20',
                'address' => 'nullable|string|max:255',
                'credit_balance' => 'nullable|numeric|min:0',
            ]);

            $customer->update($validated);

            return response()->json([
                'success' => true,
                'message' => 'Customer updated successfully',
                'data' => $customer,
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
                'message' => 'Error updating customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Delete customer
     */
    public function destroy($id): JsonResponse
    {
        try {
            $customer = Customer::find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $customer->delete();

            return response()->json([
                'success' => true,
                'message' => 'Customer deleted successfully',
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error deleting customer',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Add payment to reduce credit balance
     */
    public function addPayment(Request $request, $id): JsonResponse
    {
        try {
            $customer = Customer::find($id);

            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $validated = $request->validate([
                'amount' => 'required|numeric|min:0.01',
            ]);

            if ($validated['amount'] > $customer->credit_balance) {
                return response()->json([
                    'success' => false,
                    'message' => 'Payment amount exceeds credit balance',
                ], 400);
            }

            $customer->credit_balance -= $validated['amount'];
            $customer->save();

            return response()->json([
                'success' => true,
                'message' => 'Payment recorded successfully',
                'data' => $customer,
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
                'message' => 'Error recording payment',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}