<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Check if column doesn't exist before adding
            if (!Schema::hasColumn('sales', 'credit_session_id')) {
                $table->foreignId('credit_session_id')
                      ->nullable()
                      ->after('customer_id')
                      ->constrained('credit_sessions')
                      ->onDelete('set null');
                
                $table->index('credit_session_id');
            }
        });
    }

    public function down(): void
    {
        Schema::table('sales', function (Blueprint $table) {
            // Check if column exists before dropping
            if (Schema::hasColumn('sales', 'credit_session_id')) {
                $table->dropForeign(['credit_session_id']);
                $table->dropColumn('credit_session_id');
            }
        });
    }
};