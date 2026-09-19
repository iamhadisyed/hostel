<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payroll', function (Blueprint $table) {
            $table->id();
            $table->foreignId('staff_id')->constrained()->cascadeOnDelete();
            $table->date('period_start');
            $table->date('period_end');
            $table->decimal('gross_amount', 10, 2); // wage * attendance/days
            $table->decimal('total_deductions', 10, 2)->default(0);
            $table->decimal('total_advances', 10, 2)->default(0);
            $table->decimal('net_amount', 10, 2);
            $table->string('status')->default('pending'); // pending, paid
            $table->foreignId('paid_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamp('paid_at')->nullable();
            $table->string('slip_path')->nullable();
            $table->timestamps();

            $table->unique(['staff_id', 'period_start']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payroll');
    }
};
