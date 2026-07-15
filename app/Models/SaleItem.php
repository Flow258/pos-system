<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class SaleItem extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'sale_id',
        'product_unit_id',
        'quantity',
        'unit_price',
        'cost_price',
        'subtotal',
        'profit',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'quantity' => 'integer',
        'unit_price' => 'decimal:2',
        'cost_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'profit' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the sale that owns this item.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function sale()
    {
        return $this->belongsTo(Sale::class);
    }

    /**
     * Get the product unit that was sold.
     * 
     * This tells us which specific unit (piece, box, case) was sold,
     * including its barcode, price type, and conversion factor.
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function productUnit()
    {
        return $this->belongsTo(ProductUnit::class);
    }

    /**
     * Calculate subtotal based on quantity and unit price.
     * 
     * This is typically done before saving, but can be used
     * to recalculate if needed.
     *
     * @return float
     */
    public function calculateSubtotal()
    {
        return $this->quantity * $this->unit_price;
    }

    /**
     * Calculate profit for this line item: (unit_price - cost_price) * quantity.
     * cost_price is the snapshot taken at time of sale, not the live product cost.
     *
     * @return float
     */
    public function calculateProfit()
    {
        return $this->quantity * ((float) $this->unit_price - (float) $this->cost_price);
    }

    /**
     * Get the base product through the product unit relationship.
     * 
     * This allows direct access to the parent Product model.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasOneThrough
     */
    public function product()
    {
        return $this->productUnit->product();
    }
}