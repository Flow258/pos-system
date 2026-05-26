<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\PaymongoPayment;
use App\Models\Sale;
use App\Services\PayMongoService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    protected PayMongoService $paymongo;

    public function __construct(PayMongoService $paymongo)
    {
        $this->paymongo = $paymongo;
    }

    /**
     * Create a PayMongo GCash checkout session for a sale.
     *
     * POST /api/payments/gcash/create
     * Body: { sale_id, amount, description }
     */
    public function createGcashPayment(Request $request): JsonResponse
    {
        $request->validate([
            'sale_id' => 'required|exists:sales,id',
            'amount' => 'required|numeric|min:1',
            'description' => 'nullable|string|max:255',
        ]);

        $sale = Sale::find($request->sale_id);
        if (!$sale) {
            return response()->json([
                'success' => false,
                'message' => 'Sale not found',
            ], 404);
        }

        $frontendUrl = config('app.frontend_url', 'http://localhost:5173');

        $session = $this->paymongo->createCheckoutSession([
            'amount' => $request->amount,
            'description' => $request->description ?? "Payment for Sale #{$sale->id}",
            'name' => 'Alquizalas Store Purchase',
            'order_id' => $sale->id,
            'payment_method_types' => ['gcash'],
            'success_url' => "{$frontendUrl}/payment-success?session_id={CHECKOUT_SESSION_ID}",
            'failed_url' => "{$frontendUrl}/payment-failed?session_id={CHECKOUT_SESSION_ID}",
        ]);

        if (!$session || !$this->paymongo->getCheckoutUrl($session)) {
            Log::error('Failed to create PayMongo checkout session', [
                'sale_id' => $sale->id,
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create GCash payment. Please try again.',
            ], 500);
        }

        $checkoutUrl = $this->paymongo->getCheckoutUrl($session);
        $sessionId = $session['data']['id'];

        // Save payment record
        $payment = PaymongoPayment::create([
            'sale_id' => $sale->id,
            'amount' => $request->amount,
            'payment_method' => 'gcash',
            'paymongo_session_id' => $sessionId,
            'checkout_url' => $checkoutUrl,
            'status' => 'pending',
        ]);

        return response()->json([
            'success' => true,
            'data' => [
                'payment_id' => $payment->id,
                'paymongo_session_id' => $sessionId,
                'checkout_url' => $checkoutUrl,
            ],
        ]);
    }

    /**
     * Check payment status by PayMongo session ID.
     *
     * GET /api/payments/gcash/status/{paymongoSessionId}
     */
    public function checkGcashStatus(string $paymongoSessionId): JsonResponse
    {
        $payment = PaymongoPayment::where('paymongo_session_id', $paymongoSessionId)->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'Payment record not found',
            ], 404);
        }

        // Already confirmed as paid — fast path
        if ($payment->status === 'paid') {
            return response()->json([
                'success' => true,
                'data' => [
                    'status' => 'paid',
                    'payment' => $payment,
                ],
            ]);
        }

        // Poll PayMongo API for current status
        $session = $this->paymongo->getCheckoutSession($paymongoSessionId);
        $status = $this->paymongo->getPaymentStatus($session);

        if ($this->paymongo->isPaymentPaid($session)) {
            // Mark as paid and update the sale
            $payment->status = 'paid';
            $payment->save();

            // Update the associated sale record
            if ($payment->sale_id) {
                $sale = Sale::find($payment->sale_id);
                if ($sale) {
                    $sale->payment_method = 'gcash';
                    $sale->amount_paid = $payment->amount;
                    $sale->change_due = 0;
                    $sale->save();
                }
            }
        } elseif (in_array($status, ['failed', 'cancelled', 'expired'])) {
            $payment->status = $status;
            $payment->save();
        }

        return response()->json([
            'success' => true,
            'data' => [
                'status' => $payment->status,
                'payment' => $payment,
            ],
        ]);
    }

    /**
     * Get payment by sale ID.
     *
     * GET /api/payments/by-sale/{saleId}
     */
    public function getPaymentBySale(int $saleId): JsonResponse
    {
        $payment = PaymongoPayment::where('sale_id', $saleId)->latest()->first();

        if (!$payment) {
            return response()->json([
                'success' => false,
                'message' => 'No payment found for this sale',
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $payment,
        ]);
    }
}
