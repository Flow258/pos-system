<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymongoPayment extends Model
{
    protected $fillable = [
        'sale_id',
        'amount',
        'payment_method',
        'paymongo_session_id',
        'checkout_url',
        'status',
        'webhook_data',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'webhook_data' => 'array',
    ];

    /**
     * Get the sale associated with this payment.
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class, 'sale_id');
    }
}
