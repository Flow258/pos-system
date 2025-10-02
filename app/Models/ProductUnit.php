<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ProductUnit extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'product_id',
        'unit_name',
        'barcode',
        'price',
        'price_type',
        'conversion_factor',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'price' => 'decimal:2',
        'conversion_factor' => 'integer',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the product that owns this unit.
     * 
     * This represents the parent product (e.g., "Coca-Cola 1.5L")
     * that can be sold in different units (piece, box, case).
     *
     * @return \Illuminate\Database\Eloquent\Relations\BelongsTo
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    /**
     * Get all sale items that used this product unit.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function saleItems()
    {
        return $this->hasMany(SaleItem::class);
    }

    /**
     * Check if this unit is wholesale priced.
     *
     * @return bool
     */
    public function isWholesale()
    {
        return $this->price_type === 'wholesale';
    }

    /**
     * Check if this unit is retail priced.
     *
     * @return bool
     */
    public function isRetail()
    {
        return $this->price_type === 'retail';
    }

    /**
     * Calculate how many base units this represents.
     * 
     * Example: If conversion_factor is 24 and quantity is 2,
     * this returns 48 (2 cases × 24 pieces per case).
     *
     * @param int $quantity
     * @return int
     */
    public function calculateBaseUnits($quantity)
    {
        return $quantity * $this->conversion_factor;
    }
}