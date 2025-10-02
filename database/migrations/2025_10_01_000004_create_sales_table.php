<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the sales table which records all sales transactions.
     * Each sale can have multiple items (stored in sale_items table).
     */
    public function up(): void
    {
        Schema::create('sales', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')
                  ->nullable() // Nullable for walk-in customers
                  ->constrained('customers')
                  ->onDelete('set null'); // Keep sale record even if customer deleted
            $table->decimal('total_amount', 10, 2);
            $table->decimal('amount_paid', 10, 2);
            $table->decimal('change_due', 10, 2);
            $table->string('payment_method', 50)->nullable(); // Cash, GCash, Credit, etc.
            $table->timestamp('sale_date')->useCurrent();
            $table->timestamps();

            // Indexes for reporting and querying
            $table->index('customer_id');
            $table->index('sale_date');
            $table->index('payment_method');
            $table->index(['sale_date', 'total_amount']); // Composite for sales reports
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('sales');
    }
};