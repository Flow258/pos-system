<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Receipt extends Model
{
    protected $fillable = [
        'receipt_number', 'items', 'subtotal',
        'discount', 'total', 'cash_tendered',
        'change', 'payment_method', 'status',
    ];

    protected $casts = [
        'items' => 'array',
    ];

    // Auto-generate receipt number: RCP-YYYYMMDD-XXXX
    public static function generateNumber(): string
    {
        $date  = now()->format('Ymd');
        $count = self::whereDate('created_at', today())->count() + 1;
        return 'RCP-' . $date . '-' . str_pad($count, 4, '0', STR_PAD_LEFT);
    }
}