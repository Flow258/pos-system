<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the products table which stores core product information.
     * Stock is tracked in the base unit (typically 'piece').
     */
    public function up(): void
    {
        Schema::create('products', function (Blueprint $table) {
            $table->id();
            $table->string('name', 255);
            $table->text('description')->nullable();
            $table->string('category', 100)->nullable();
            $table->string('base_unit', 20)->default('piece');
            $table->decimal('stock_quantity', 10, 2)->default(0);
            $table->decimal('low_stock_threshold', 10, 2)->default(10);
            $table->timestamps();

            // Indexes for faster querying
            $table->index('category');
            $table->index('stock_quantity');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('products');
    }
};