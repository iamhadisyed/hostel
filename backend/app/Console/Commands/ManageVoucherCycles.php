<?php

namespace App\Console\Commands;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\BookingCycle;
use App\Models\Voucher;
use App\Services\VoucherService;
use Illuminate\Console\Command;
use Illuminate\Support\Carbon;

class ManageVoucherCycles extends Command
{
    protected $signature = 'vouchers:manage-cycles';

    protected $description = 'Auto-generate upcoming monthly rent cycles and expire unpaid overdue vouchers.';

    public function handle(VoucherService $voucherService): int
    {
        $this->generateUpcomingCycles($voucherService);
        $this->expireOverdueVouchers();

        return self::SUCCESS;
    }

    private function generateUpcomingCycles(VoucherService $voucherService): void
    {
        $leadDays = 5;
        $horizon = Carbon::now()->addDays($leadDays);

        Booking::query()
            ->where('is_recurring', true)
            ->whereIn('status', [Booking::STATUS_ACTIVE, Booking::STATUS_APPROVED])
            ->whereHas('cycles', function ($query) use ($horizon) {
                $query->where('period_end', '<=', $horizon->toDateString());
            })
            ->with('cycles')
            ->each(function (Booking $booking) use ($voucherService) {
                $latestCycle = $booking->cycles->sortByDesc('period_end')->first();

                if (! $latestCycle) {
                    return;
                }

                $alreadyHasNextCycle = $booking->cycles
                    ->contains(fn (BookingCycle $cycle) => $cycle->period_start->gt($latestCycle->period_end));

                if ($alreadyHasNextCycle) {
                    return;
                }

                $cycle = $voucherService->createNextCycle($booking);

                $this->info("Generated cycle #{$cycle->id} for booking #{$booking->id} (voucher {$cycle->voucher->voucher_number}).");
            });
    }

    private function expireOverdueVouchers(): void
    {
        $overdueVouchers = Voucher::query()
            ->where('status', Voucher::STATUS_PENDING)
            ->where('due_date', '<', Carbon::now()->toDateString())
            ->with('bookingCycle.booking.bed')
            ->get();

        foreach ($overdueVouchers as $voucher) {
            $voucher->update(['status' => Voucher::STATUS_EXPIRED]);
            $voucher->bookingCycle->update(['status' => BookingCycle::STATUS_EXPIRED]);

            $booking = $voucher->bookingCycle->booking;

            // Only the first, never-activated cycle expiring should release the
            // held bed and drop the booking - a renewal cycle lapsing on an
            // already-active stay is a billing matter for the Warden, not an
            // automatic eviction.
            if ($booking->status === Booking::STATUS_APPROVED) {
                $booking->update(['status' => Booking::STATUS_REJECTED, 'rejection_reason' => 'Voucher expired unpaid.']);
                $booking->bed?->update(['status' => Bed::STATUS_AVAILABLE]);
            }

            $this->info("Expired voucher {$voucher->voucher_number}.");
        }
    }
}
