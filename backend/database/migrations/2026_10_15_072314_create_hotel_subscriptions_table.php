<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('hotel_subscriptions', function (Blueprint $table) {
            $table->id();
            $table->foreignId('hotel_id')->unique()->constrained()->cascadeOnDelete();

            // One-time setup fee, separate from the recurring plan below.
            $table->decimal('onboarding_fee', 10, 2)->default(0);
            $table->timestamp('onboarding_fee_paid_at')->nullable();

            // Recurring plan.
            $table->string('billing_cycle')->default('monthly'); // monthly, yearly
            $table->decimal('recurring_amount', 10, 2)->default(0);
            // The date the recurring plan started - billing periods are computed
            // from this anchor (e.g. monthly: same day-of-month each cycle).
            $table->date('billing_anchor_date');

            $table->text('notes')->nullable();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('hotel_subscriptions');
    }
};
