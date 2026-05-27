<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Adds a credit_session_id to the sales table so credit sales
     * can be grouped under the active CreditSession. This allows
     * viewing only the current session's history and starting fresh
     * when a customer settles their balance.
     */
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->foreignId('credit_session_id')
                  ->nullable()
                  ->after('customer_id')
                  ->constrained('credit_sessions')
                  ->onDelete('set null');

            $table->index('credit_session_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            $table->dropForeign(['credit_session_id']);
            $table->dropColumn('credit_session_id');
        });
    }
};