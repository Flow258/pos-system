<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<int, string>
     */
    protected $fillable = [
        'name',
        'description',
        'category',
        'base_unit',
        'stock_quantity',
        'low_stock_threshold',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'stock_quantity' => 'decimal:2',
        'low_stock_threshold' => 'decimal:2',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get all product units (different selling units) for this product.
     * 
     * A product can be sold in multiple units (piece, box, case, etc.)
     * Each unit has its own barcode, price, and conversion factor.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany
     */
    public function productUnits()
    {
        return $this->hasMany(ProductUnit::class);
    }

    /**
     * Check if the product is low on stock.
     *
     * @return bool
     */
    public function isLowStock()
    {
        return $this->stock_quantity <= $this->low_stock_threshold;
    }

    /**
     * Deduct stock based on quantity and conversion factor.
     * 
     * This method handles the business logic of converting sold units
     * back to base units before deducting from stock.
     *
     * @param int $quantity The quantity of units sold
     * @param int $conversionFactor How many base units in one sold unit
     * @return bool
     */
    public function deductStock($quantity, $conversionFactor)
    {
        $baseUnitsToDeduct = $quantity * $conversionFactor;
        
        if ($this->stock_quantity >= $baseUnitsToDeduct) {
            $this->stock_quantity -= $baseUnitsToDeduct;
            return $this->save();
        }
        
        return false; // Insufficient stock
    }

    /**
     * Add stock based on quantity and conversion factor.
     *
     * @param int $quantity
     * @param int $conversionFactor
     * @return bool
     */
    public function addStock($quantity, $conversionFactor)
    {
        $baseUnitsToAdd = $quantity * $conversionFactor;
        $this->stock_quantity += $baseUnitsToAdd;
        return $this->save();
    }
}