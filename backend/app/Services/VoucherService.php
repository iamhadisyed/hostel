<?php

namespace App\Services;

use App\Models\Booking;
use App\Models\BookingCycle;
use App\Models\Voucher;
use Illuminate\Support\Carbon;
use Illuminate\Support\Str;

class VoucherService
{
    /**
     * Create the next billing cycle + voucher for a booking's monthly rent renewal.
     */
    public function createNextCycle(Booking $booking): BookingCycle
    {
        $lastCycle = $booking->cycles()->latest('period_end')->first();

        $periodStart = $lastCycle
            ? Carbon::parse($lastCycle->period_end)->addDay()
            : Carbon::parse($booking->check_in_date ?? now());

        $periodEnd = $periodStart->copy()->addMonthNoOverflow()->subDay();

        $cycle = $booking->cycles()->create([
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'amount' => $booking->roomType->monthly_price,
            'status' => BookingCycle::STATUS_PENDING_PAYMENT,
        ]);

        $this->createVoucherForCycle($cycle);

        return $cycle->load('voucher');
    }

    public function createVoucherForCycle(BookingCycle $cycle): Voucher
    {
        return Voucher::create([
            'booking_cycle_id' => $cycle->id,
            'voucher_number' => $this->generateVoucherNumber(),
            'amount' => $cycle->amount,
            'due_date' => Carbon::parse($cycle->period_start)->addDays(7),
            'status' => Voucher::STATUS_PENDING,
        ]);
    }

    private function generateVoucherNumber(): string
    {
        do {
            $number = 'V'.now()->format('ym').strtoupper(Str::random(6));
        } while (Voucher::where('voucher_number', $number)->exists());

        return $number;
    }
}
