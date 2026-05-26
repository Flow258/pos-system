<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Tracks PayMongo checkout sessions linked to sales orders.
     */
    public function up(): void
    {
        Schema::create('paymongo_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sale_id')
                  ->nullable()
                  ->constrained('sales')
                  ->onDelete('cascade');
            $table->decimal('amount', 10, 2);
            $table->string('payment_method')->default('gcash'); // gcash, card, maya
            $table->string('paymongo_session_id', 100)->unique(); // e.g. cs_xxx
            $table->string('checkout_url')->nullable();
            $table->string('status')->default('pending'); // pending, paid, failed, cancelled
            $table->json('webhook_data')->nullable();
            $table->timestamps();

            $table->index('sale_id');
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('paymongo_payments');
    }
};
