<?php

namespace App\Services;

use App\Models\Hotel;
use App\Models\HotelBillingPayment;
use Illuminate\Support\Carbon;

class HotelBillingStatusService
{
    public const STATUS_NO_PLAN = 'no_plan';

    public const STATUS_UPCOMING = 'upcoming';

    public const STATUS_CURRENT = 'current';

    public const STATUS_OVERDUE = 'overdue';

    /**
     * @return array{
     *     status: string,
     *     current_period_start: ?string,
     *     current_period_end: ?string,
     *     days_overdue: int,
     *     onboarding_paid: bool,
     * }
     */
    public function statusFor(Hotel $hotel): array
    {
        $subscription = $hotel->subscription;

        if (! $subscription) {
            return [
                'status' => self::STATUS_NO_PLAN,
                'current_period_start' => null,
                'current_period_end' => null,
                'days_overdue' => 0,
                'onboarding_paid' => false,
            ];
        }

        $today = Carbon::today();
        $anchor = Carbon::parse($subscription->billing_anchor_date)->startOfDay();
        $onboardingPaid = $subscription->onboarding_fee <= 0 || $subscription->onboarding_fee_paid_at !== null;

        if ($anchor->greaterThan($today)) {
            return [
                'status' => self::STATUS_UPCOMING,
                'current_period_start' => $anchor->toDateString(),
                'current_period_end' => null,
                'days_overdue' => 0,
                'onboarding_paid' => $onboardingPaid,
            ];
        }

        [$periodStart, $periodEnd] = $this->currentPeriod($anchor, $today, $subscription->billing_cycle);

        $paid = HotelBillingPayment::query()
            ->where('hotel_id', $hotel->id)
            ->where('type', HotelBillingPayment::TYPE_RECURRING)
            ->whereDate('period_start', $periodStart->toDateString())
            ->exists();

        $status = $paid ? self::STATUS_CURRENT : self::STATUS_OVERDUE;
        $daysOverdue = $paid ? 0 : (int) $periodStart->diffInDays($today, false);

        return [
            'status' => $status,
            'current_period_start' => $periodStart->toDateString(),
            'current_period_end' => $periodEnd->toDateString(),
            'days_overdue' => max(0, $daysOverdue),
            'onboarding_paid' => $onboardingPaid,
        ];
    }

    /**
     * @return array{0: Carbon, 1: Carbon}
     */
    private function currentPeriod(Carbon $anchor, Carbon $today, string $cycle): array
    {
        $periodStart = $anchor->copy();

        while (true) {
            $periodEnd = $cycle === 'yearly'
                ? $periodStart->copy()->addYear()
                : $periodStart->copy()->addMonth();

            if ($periodEnd->greaterThan($today)) {
                return [$periodStart, $periodEnd];
            }

            $periodStart = $periodEnd;
        }
    }
}
