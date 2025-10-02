<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Sale extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'customer_id',
        'total_amount',
        'amount_paid',
        'change_due',
        'payment_method',
        'sale_date',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'total_amount' => 'decimal:2',
        'amount_paid' => 'decimal:2',
        'change_due' => 'decimal:2',
        'sale_date' => 'datetime',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the customer who made this purchase.
     * 
     * Nullable relationship - walk-in customers may not be recorded.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    /**
     * Get all items in this sale.
     * 
     * A sale consists of one or more sale items (products).
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Check if this sale was made on credit.
     *
     * @return bool
     */
    public function isCredit()
    {
        return $this->payment_method === 'Credit' || $this->payment_method === 'credit';
    }

    /**
     * Check if the customer has fully paid.
     *
     * @return bool
     */
    public function isFullyPaid()
    {
        return $this->amount_paid >= $this->total_amount;
    }

    /**
     * Get the remaining balance if payment was partial.
     *
     * @return float
     */
    public function getRemainingBalance()
    {
        $balance = $this->total_amount - $this->amount_paid;
        return max(0, $balance); // Never return negative balance
    }

    /**
     * Calculate profit for this sale.
     * 
     * Note: This requires cost price to be tracked in the system.
     * Placeholder for future enhancement.
     *
     * @return float
     */
    public function calculateProfit()
    {
        // TODO: Implement when cost tracking is added
        return 0;
    }
}