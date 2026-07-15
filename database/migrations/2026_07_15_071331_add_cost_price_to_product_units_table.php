<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('product_units', function (Blueprint $table) {
            // What this unit actually costs you (supplier cost), as opposed to
            // `price`, which is what the customer pays. Defaults to 0 so existing
            // rows don't break; profit reads as 0 until backfilled.
            $table->decimal('cost_price', 10, 2)->default(0)->after('price');
        });
    }

    public function down(): void
    {
        Schema::table('product_units', function (Blueprint $table) {
            $table->dropColumn('cost_price');
        });
    }
};
