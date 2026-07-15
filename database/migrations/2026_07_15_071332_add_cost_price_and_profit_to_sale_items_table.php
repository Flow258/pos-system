<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            // Snapshot of the product unit's cost_price AT THE TIME OF SALE.
            // Deliberately copied rather than looked up live, so historical
            // profit doesn't shift if you edit a product's cost price later.
            $table->decimal('cost_price', 10, 2)->default(0)->after('unit_price');
            $table->decimal('profit', 10, 2)->default(0)->after('subtotal');
        });
    }

    public function down(): void
    {
        Schema::table('sale_items', function (Blueprint $table) {
            $table->dropColumn(['cost_price', 'profit']);
        });
    }
};
