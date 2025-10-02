<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * 
     * Creates the customers table for tracking customer information,
     * especially resellers and their credit balances (utang).
     */
    public function up(): void
    {
        Schema::create('customers', function (Blueprint $table) {
            $table->id();
            $table->string('name', 150);
            $table->string('phone_number', 20)->nullable();
            $table->string('address', 255)->nullable();
            $table->decimal('credit_balance', 10, 2)->default(0.00); // Utang tracking
            $table->timestamps();

            // Indexes for faster searching
            $table->index('name');
            $table->index('phone_number');
            $table->index('credit_balance');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('customers');
    }
};