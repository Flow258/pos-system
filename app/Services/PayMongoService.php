<?php

namespace App\Services;

use GuzzleHttp\Client;
use Illuminate\Support\Facades\Log;

class PayMongoService
{
    protected Client $client;
    protected string $secretKey;
    protected string $publicKey;

    public function __construct()
    {
        $this->secretKey = config('services.paymongo.secret_key');
        $this->publicKey = config('services.paymongo.public_key');

        $this->client = new Client([
            'base_uri' => 'https://api.paymongo.com/v1/',
            'auth' => [$this->secretKey, ''],
            'headers' => [
                'Accept' => 'application/json',
                'Content-Type' => 'application/json',
            ],
        ]);
    }

    /**
     * Create a PayMongo checkout session.
     *
     * @param array $params
     * @return array|null
     */
    public function createCheckoutSession(array $params): ?array
    {
        try {
            $response = $this->client->post('checkout_sessions', [
                'json' => [
                    'data' => [
                        'attributes' => [
                            'send_email_receipt' => false,
                            'show_description' => true,
                            'show_line_items' => true,
                            'payment_method_types' => $params['payment_method_types'] ?? ['gcash'],
                            'line_items' => [
                                [
                                    'currency' => 'PHP',
                                    'amount' => (int) ($params['amount'] * 100), // Convert to centavos
                                    'description' => $params['description'] ?? 'POS System Payment',
                                    'name' => $params['name'] ?? 'Store Purchase',
                                    'quantity' => 1,
                                ],
                            ],
                            'success_url' => $params['success_url'],
                            'failed_url' => $params['failed_url'],
                            'metadata' => [
                                'order_id' => (string) $params['order_id'],
                                'source' => 'pos_system',
                            ],
                        ],
                    ],
                ],
            ]);

            $result = json_decode($response->getBody(), true);

            Log::info('PayMongo checkout session created', [
                'order_id' => $params['order_id'],
                'session_id' => $result['data']['id'] ?? null,
            ]);

            return $result;

        } catch (\Exception $e) {
            Log::error('PayMongo createCheckoutSession failed: ' . $e->getMessage(), [
                'order_id' => $params['order_id'] ?? null,
                'trace' => $e->getTraceAsString(),
            ]);
            return null;
        }
    }

    /**
     * Retrieve a checkout session status.
     *
     * @param string $checkoutSessionId
     * @return array|null
     */
    public function getCheckoutSession(string $checkoutSessionId): ?array
    {
        try {
            $response = $this->client->get("checkout_sessions/{$checkoutSessionId}");

            $result = json_decode($response->getBody(), true);

            return $result;

        } catch (\Exception $e) {
            Log::error('PayMongo getCheckoutSession failed: ' . $e->getMessage(), [
                'session_id' => $checkoutSessionId,
            ]);
            return null;
        }
    }

    /**
     * Get the checkout URL from a checkout session response.
     *
     * @param array $session
     * @return string|null
     */
    public function getCheckoutUrl(?array $session): ?string
    {
        return $session['data']['attributes']['checkout_url'] ?? null;
    }

    /**
     * Get the payment status from a checkout session.
     *
     * @param array|null $session
     * @return string
     */
    public function getPaymentStatus(?array $session): string
    {
        return $session['data']['attributes']['payment_status'] ?? 'unknown';
    }

    /**
     * Check if payment was successful.
     *
     * @param array|null $session
     * @return bool
     */
    public function isPaymentPaid(?array $session): bool
    {
        return $this->getPaymentStatus($session) === 'paid';
    }
}
