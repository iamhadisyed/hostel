<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('booking_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('booking_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('amount', 10, 2);
            $table->string('status')->default('pending_payment'); // pending_payment, paid, expired
            $table->timestamps();

            $table->unique(['booking_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('booking_cycles');
    }
};
