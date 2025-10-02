<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the product_units table which allows products to be sold
     * in different units (piece, box, case) with unique barcodes.
     * This is the key to multi-unit functionality.
     */
    public function up(): void
    {
        Schema::create('product_units', function (Blueprint $table) {
            $table->id();
            $table->foreignId('product_id')
                  ->constrained('products')
                  ->onDelete('cascade'); // Delete units when product is deleted
            $table->string('unit_name', 50);
            $table->string('barcode', 100)->unique(); // Each unit has unique barcode
            $table->decimal('price', 10, 2);
            $table->enum('price_type', ['retail', 'wholesale']);
            $table->integer('conversion_factor'); // How many base units in this unit
            $table->timestamps();

            // Indexes for faster lookups
            $table->index('product_id');
            $table->index('barcode'); // Critical for barcode scanning speed
            $table->index('price_type');
        });
    }

    /*2025_10_01_000001_create_products_table.php*
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('product_units');
    }
};