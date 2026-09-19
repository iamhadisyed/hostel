<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vouchers', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_cycle_id')->constrained()->cascadeOnDelete();
            $table->string('voucher_number')->unique();
            $table->decimal('amount', 10, 2);
            $table->date('due_date');
            $table->string('status')->default('pending'); // pending, paid, expired, cancelled
            $table->string('pdf_path')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vouchers');
    }
};
