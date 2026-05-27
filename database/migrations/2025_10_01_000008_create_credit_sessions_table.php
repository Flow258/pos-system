<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Creates the credit_sessions table which groups credit transactions
     * into sessions. When a customer settles their balance, the current
     * session is marked as settled and a fresh session starts.
     */
    public function up(): void
    {
        Schema::create('credit_sessions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('customer_id')
                  ->constrained('customers')
                  ->onDelete('cascade');
            $table->integer('session_number'); // 1, 2, 3... per customer
            $table->decimal('total_credit', 10, 2)->default(0);
            $table->decimal('total_paid', 10, 2)->default(0);
            $table->boolean('is_settled')->default(false);
            $table->timestamp('settled_at')->nullable();
            $table->text('notes')->nullable();
            $table->timestamps();

            $table->index('customer_id');
            $table->index('is_settled');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('credit_sessions');
    }
};