<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\Expense;
use App\Models\Hotel;
use App\Models\Payroll;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;

class AnalyticsController extends Controller
{
    /**
     * Owner's cross-property (or single-property) rollup: revenue, payroll,
     * expenses, net savings, occupancy, average stay, and pricing
     * performance by room type.
     */
    public function summary(Request $request): JsonResponse
    {
        $actor = $request->user();

        $hotels = $this->resolveHotels($actor, $request);

        $from = $request->filled('from') ? Carbon::parse($request->input('from')) : now()->startOfMonth();
        $to = $request->filled('to') ? Carbon::parse($request->input('to')) : now()->endOfMonth();

        $hotelIds = $hotels->pluck('id');

        $revenue = Voucher::whereIn('booking_cycle_id', function ($query) use ($hotelIds) {
            $query->select('id')->from('booking_cycles')->whereIn('booking_id', function ($q) use ($hotelIds) {
                $q->select('id')->from('bookings')->whereIn('hotel_id', $hotelIds);
            });
        })
            ->where('status', Voucher::STATUS_PAID)
            ->whereBetween('updated_at', [$from, $to])
            ->sum('amount');

        $payrollTotal = Payroll::whereIn('staff_id', function ($query) use ($hotelIds) {
            $query->select('id')->from('staff')->whereIn('hotel_id', $hotelIds);
        })
            ->where('status', Payroll::STATUS_PAID)
            ->whereBetween('paid_at', [$from, $to])
            ->sum('net_amount');

        $expensesTotal = Expense::whereIn('hotel_id', $hotelIds)
            ->where('status', Expense::STATUS_APPROVED)
            ->whereBetween('date', [$from, $to])
            ->sum('amount');

        $totalBeds = Bed::whereIn('hotel_id', $hotelIds)->count();
        $occupiedBeds = Bed::whereIn('hotel_id', $hotelIds)->where('status', Bed::STATUS_OCCUPIED)->count();

        $checkedOutBookings = Booking::whereIn('hotel_id', $hotelIds)
            ->where('status', Booking::STATUS_CHECKED_OUT)
            ->whereNotNull('check_in_date')
            ->whereNotNull('checked_out_at')
            ->get();

        $averageStayDays = $checkedOutBookings->isEmpty()
            ? null
            : round($checkedOutBookings->avg(fn ($b) => Carbon::parse($b->check_in_date)->diffInDays($b->checked_out_at)), 1);

        $pricingByRoomType = \App\Models\RoomType::whereIn('hotel_id', $hotelIds)
            ->with('rooms.beds')
            ->get()
            ->map(function ($roomType) {
                $beds = $roomType->rooms->flatMap->beds;

                return [
                    'room_type' => $roomType->name,
                    'monthly_price' => $roomType->monthly_price,
                    'occupied_beds' => $beds->where('status', Bed::STATUS_OCCUPIED)->count(),
                    'total_beds' => $beds->count(),
                ];
            });

        return response()->json([
            'period' => ['from' => $from->toDateString(), 'to' => $to->toDateString()],
            'revenue' => round((float) $revenue, 2),
            'payroll_total' => round((float) $payrollTotal, 2),
            'expenses_total' => round((float) $expensesTotal, 2),
            'net_savings' => round((float) $revenue - (float) $payrollTotal - (float) $expensesTotal, 2),
            'occupancy_rate' => $totalBeds > 0 ? round($occupiedBeds / $totalBeds * 100, 1) : null,
            'average_stay_days' => $averageStayDays,
            'pricing_performance' => $pricingByRoomType,
        ]);
    }

    private function resolveHotels(User $actor, Request $request)
    {
        abort_unless($actor->isSuperAdmin() || $actor->isOwner(), 403);

        $query = Hotel::query();

        if ($actor->isOwner()) {
            $query->where('owner_id', $actor->id);
        }

        if ($request->filled('hotel_id')) {
            $query->where('id', $request->integer('hotel_id'));
        }

        $hotels = $query->get();

        abort_if($hotels->isEmpty(), 404, 'No properties found for this scope.');

        return $hotels;
    }
}
