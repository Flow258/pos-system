<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Customer extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'phone_number',
        'address',
        'credit_balance',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'credit_balance' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all sales for this customer.
     * 
     * This allows tracking of purchase history for resellers
     * and regular customers.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function sales()
    {
        return $this->hasMany(Sale::class);
    }

    /**
     * Check if customer has outstanding credit (utang).
     *
     * @return bool
     */
    public function hasCredit()
    {
        return $this->credit_balance > 0;
    }

    /**
     * Add to customer's credit balance.
     * 
     * Used when a sale is made on credit.
     *
     * @param float $amount
     * @return bool
     */
    public function addCredit($amount)
    {
        $this->credit_balance += $amount;
        return $this->save();
    }

    /**
     * Reduce customer's credit balance.
     * 
     * Used when customer makes a payment.
     *
     * @param float $amount
     * @return bool
     */
    public function reduceCredit($amount)
    {
        if ($amount > $this->credit_balance) {
            return false; // Cannot reduce more than current balance
        }
        
        $this->credit_balance -= $amount;
        return $this->save();
    }

    /**
     * Get total amount purchased by this customer.
     *
     * @return float
     */
    public function getTotalPurchases()
    {
        return $this->sales()->sum('total_amount');
    }
}