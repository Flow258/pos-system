<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CreditSession extends Model
{
    use HasFactory;

    protected $fillable = [
        'customer_id',
        'session_number',
        'total_credit',
        'total_paid',
        'is_settled',
        'settled_at',
        'notes',
    ];

    protected $casts = [
        'total_credit'  => 'decimal:2',
        'total_paid'    => 'decimal:2',
        'is_settled'    => 'boolean',
        'settled_at'    => 'datetime',
        'created_at'    => 'datetime',
        'updated_at'    => 'datetime',
    ];

    // ─── Relationships ────────────────────────────────────────────────────────

    public function customer()
    {
        return $this->belongsTo(Customer::class);
    }

    public function sales()
    {
        return $this->hasMany(Sale::class)->orderBy('sale_date', 'desc');
    }

    // ─── Computed helpers ─────────────────────────────────────────────────────

    /**
     * Remaining balance still owed in this session.
     */
    public function getRemainingBalanceAttribute(): float
    {
        return max(0, (float) $this->total_credit - (float) $this->total_paid);
    }

    public function getIsFullyPaidAttribute(): bool
    {
        return $this->remaining_balance <= 0;
    }

    // ─── Business logic ───────────────────────────────────────────────────────

    /**
     * Mark this session as settled (all utang paid off).
     * The customer's credit_balance is NOT zeroed here; the caller
     * must do that after confirming the balance is truly 0.
     */
    public function settle(string $notes = null): bool
    {
        $this->is_settled  = true;
        $this->settled_at  = now();
        $this->notes       = $notes;

        return $this->save();
    }

    /**
     * Add a credit purchase amount to this session's running total.
     */
    public function addCredit(float $amount): void
    {
        $this->increment('total_credit', $amount);
    }

    /**
     * Add a payment amount to this session's running total.
     */
    public function addPayment(float $amount): void
    {
        $this->increment('total_paid', $amount);
    }

    // ─── Static factory ───────────────────────────────────────────────────────

    /**
     * Get the current open session for a customer, or create one.
     *
     * Use this whenever recording a credit sale so it's always
     * linked to the right session.
     */
    public static function getOrCreateActive(Customer $customer): self
    {
        $session = self::where('customer_id', $customer->id)
            ->where('is_settled', false)
            ->latest()
            ->first();

        if (! $session) {
            $nextNumber = self::where('customer_id', $customer->id)->max('session_number') + 1;

            $session = self::create([
                'customer_id'    => $customer->id,
                'session_number' => $nextNumber,
                'total_credit'   => 0,
                'total_paid'     => 0,
                'is_settled'     => false,
            ]);
        }

        return $session;
    }
}