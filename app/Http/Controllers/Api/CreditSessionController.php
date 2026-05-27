<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Customer;
use App\Models\CreditSession;
use App\Models\Sale;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class CreditSessionController extends Controller
{
    /**
     * Get the active session's sales for a customer.
     *
     * GET /api/credit-sessions/{customerId}/active/sales
     */
    public function activeSessionSales($customerId): JsonResponse
    {
        try {
            $customer = Customer::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $session = CreditSession::where('customer_id', $customerId)
                ->where('is_settled', false)
                ->latest()
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => true,
                    'data' => [
                        'session' => null,
                        'sales' => [],
                    ],
                ], 200);
            }

            $sales = Sale::with(['customer', 'saleItems.productUnit.product'])
                ->where('credit_session_id', $session->id)
                ->where('customer_id', $customerId)
                ->orderBy('sale_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => $session,
                    'sales' => $sales,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching active session',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Start a new season (close current session, create fresh one).
     *
     * POST /api/credit-sessions/{customerId}/start-fresh
     */
    public function startFresh($customerId): JsonResponse
    {
        try {
            $customer = Customer::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            // Get the current active session (if any)
            $currentSession = CreditSession::where('customer_id', $customerId)
                ->where('is_settled', false)
                ->latest()
                ->first();

            if ($currentSession) {
                // Settle it
                $currentSession->settle('Manually closed — new season started');
            }

            // Create a brand new session (session_number auto-increments in getOrCreateActive)
            $newSession = CreditSession::getOrCreateActive($customer);

            return response()->json([
                'success' => true,
                'message' => 'New season started! Previous history is archived.',
                'data' => [
                    'new_session' => $newSession,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error starting fresh session',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get all sessions for a customer (history of past seasons).
     *
     * GET /api/credit-sessions/{customerId}
     */
    public function index($customerId): JsonResponse
    {
        try {
            $customer = Customer::find($customerId);
            if (!$customer) {
                return response()->json([
                    'success' => false,
                    'message' => 'Customer not found',
                ], 404);
            }

            $sessions = CreditSession::where('customer_id', $customerId)
                ->withCount('sales')
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => $sessions,
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching sessions',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }

    /**
     * Get sales for a specific session.
     *
     * GET /api/credit-sessions/{customerId}/session/{sessionId}/sales
     */
    public function sessionSales($customerId, $sessionId): JsonResponse
    {
        try {
            $session = CreditSession::where('id', $sessionId)
                ->where('customer_id', $customerId)
                ->first();

            if (!$session) {
                return response()->json([
                    'success' => false,
                    'message' => 'Session not found',
                ], 404);
            }

            $sales = Sale::with(['customer', 'saleItems.productUnit.product'])
                ->where('credit_session_id', $session->id)
                ->where('customer_id', $customerId)
                ->orderBy('sale_date', 'desc')
                ->get();

            return response()->json([
                'success' => true,
                'data' => [
                    'session' => $session,
                    'sales' => $sales,
                ],
            ], 200);

        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error fetching session sales',
                'error' => config('app.debug') ? $e->getMessage() : 'Internal server error',
            ], 500);
        }
    }
}