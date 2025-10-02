<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the sale_items table which stores individual line items
     * for each sale. Links to product_units to track which specific
     * unit (piece, box, case) was sold.
     */
    public function up(): void
    {
        Schema::create('sale_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')
                  ->constrained('sales')
                  ->onDelete('cascade'); // Delete items when sale is deleted
            $table->foreignId('product_unit_id')
                  ->constrained('product_units')
                  ->onDelete('restrict'); // Prevent deletion of units with sale history
            $table->integer('quantity');
            $table->decimal('unit_price', 10, 2); // Price at time of sale (for history)
            $table->decimal('subtotal', 10, 2); // quantity × unit_price
            $table->timestamps();

            // Indexes for reporting and analysis
            $table->index('sale_id');
            $table->index('product_unit_id');
            $table->index(['sale_id', 'product_unit_id']); // Composite for detailed reports
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sale_items');
    }
};