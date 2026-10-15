<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Billing\StoreHotelBillingPaymentRequest;
use App\Http\Requests\Billing\UpdateHotelSubscriptionRequest;
use App\Models\Hotel;
use App\Models\HotelBillingPayment;
use App\Services\AuditLogService;
use App\Services\HotelBillingStatusService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelBillingController extends Controller
{
    public function __construct(
        private readonly AuditLogService $auditLog,
        private readonly HotelBillingStatusService $billingStatus
    ) {}

    public function show(Hotel $hotel): JsonResponse
    {
        return response()->json([
            'subscription' => $hotel->subscription,
            'status' => $this->billingStatus->statusFor($hotel),
            'payments' => $hotel->billingPayments()->with('recordedByUser')->latest('paid_at')->get(),
        ]);
    }

    public function updateSubscription(UpdateHotelSubscriptionRequest $request, Hotel $hotel): JsonResponse
    {
        $before = $hotel->subscription?->toArray() ?? [];

        $subscription = $hotel->subscription()->updateOrCreate(
            ['hotel_id' => $hotel->id],
            $request->only(['onboarding_fee', 'billing_cycle', 'recurring_amount', 'billing_anchor_date', 'notes'])
        );

        $this->auditLog->log($request->user(), $hotel->id, 'hotel.billing.updated', $subscription, $before, $subscription->toArray());

        return response()->json([
            'subscription' => $subscription,
            'status' => $this->billingStatus->statusFor($hotel->fresh()),
        ]);
    }

    public function storePayment(StoreHotelBillingPaymentRequest $request, Hotel $hotel): JsonResponse
    {
        $payment = $hotel->billingPayments()->create([
            'type' => $request->input('type'),
            'period_start' => $request->input('period_start'),
            'period_end' => $request->input('period_end'),
            'amount' => $request->input('amount'),
            'paid_at' => $request->input('paid_at'),
            'recorded_by' => $request->user()->id,
            'note' => $request->input('note'),
        ]);

        if ($payment->type === HotelBillingPayment::TYPE_ONBOARDING && $hotel->subscription && ! $hotel->subscription->onboarding_fee_paid_at) {
            $hotel->subscription->update(['onboarding_fee_paid_at' => $payment->paid_at]);
        }

        $this->auditLog->log($request->user(), $hotel->id, 'hotel.billing.payment_recorded', $payment, [], $payment->toArray());

        return response()->json([
            'payment' => $payment->load('recordedByUser'),
            'status' => $this->billingStatus->statusFor($hotel->fresh()),
        ], 201);
    }

    public function dashboard(Request $request): JsonResponse
    {
        $hotels = Hotel::query()->with(['owner', 'subscription'])->get();

        $rows = $hotels->map(function (Hotel $hotel) {
            $status = $this->billingStatus->statusFor($hotel);

            return [
                'hotel' => $hotel,
                'billing' => $status,
            ];
        });

        $overdue = $rows
            ->filter(fn (array $r) => $r['billing']['status'] === HotelBillingStatusService::STATUS_OVERDUE)
            ->sortByDesc(fn (array $r) => $r['billing']['days_overdue'])
            ->values();

        $upcoming = $rows
            ->filter(fn (array $r) => $r['billing']['status'] === HotelBillingStatusService::STATUS_UPCOMING)
            ->values();

        $estimatedMonthlyRevenue = $hotels->sum(function (Hotel $hotel) {
            $sub = $hotel->subscription;

            if (! $sub || ! $hotel->is_active) {
                return 0;
            }

            return $sub->billing_cycle === 'yearly' ? $sub->recurring_amount / 12 : $sub->recurring_amount;
        });

        return response()->json([
            'summary' => [
                'total_properties' => $hotels->count(),
                'active_properties' => $hotels->where('is_active', true)->count(),
                'inactive_properties' => $hotels->where('is_active', false)->count(),
                'overdue_count' => $overdue->count(),
                'upcoming_count' => $upcoming->count(),
                'estimated_monthly_revenue' => round($estimatedMonthlyRevenue, 2),
            ],
            'overdue' => $overdue,
            'upcoming' => $upcoming,
        ]);
    }
}
