<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_billing_payments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->constrained()->cascadeOnDelete();
            $table->string('type'); // onboarding, recurring

            // Only meaningful for recurring payments - which billing period this covers.
            $table->date('period_start')->nullable();
            $table->date('period_end')->nullable();

            $table->decimal('amount', 10, 2);
            $table->date('paid_at');
            $table->foreignId('recorded_by')->constrained('users')->restrictOnDelete();
            $table->text('note')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_billing_payments');
    }
};
