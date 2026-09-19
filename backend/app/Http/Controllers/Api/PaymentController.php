<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\BookingCycle;
use App\Models\User;
use App\Models\Voucher;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class PaymentController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function store(Request $request, Voucher $voucher): JsonResponse
    {
        $booking = $voucher->bookingCycle->booking;

        abort_unless($request->user()->id === $booking->user_id, 403);
        abort_unless($voucher->status === Voucher::STATUS_PENDING, 422, 'This voucher is not awaiting payment.');

        $request->validate([
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $disk = config('filesystems.default');
        $path = $request->file('file')->store('payment-proofs/'.$booking->id, $disk);

        $payment = $voucher->payments()->create([
            'amount' => $voucher->amount,
            'proof_path' => $path,
            'status' => \App\Models\Payment::STATUS_PENDING,
        ]);

        return response()->json($payment, 201);
    }

    public function verify(Request $request, \App\Models\Payment $payment): JsonResponse
    {
        $voucher = $payment->voucher;
        $cycle = $voucher->bookingCycle;
        $booking = $cycle->booking;

        $this->authorizeManage($request->user(), $booking);

        abort_unless($payment->status === \App\Models\Payment::STATUS_PENDING, 422, 'This payment has already been reviewed.');

        $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'reason' => ['nullable', 'string'],
        ]);

        DB::transaction(function () use ($request, $payment, $voucher, $cycle, $booking) {
            $approved = $request->input('decision') === 'approved';

            $payment->update([
                'status' => $approved ? \App\Models\Payment::STATUS_APPROVED : \App\Models\Payment::STATUS_REJECTED,
                'verified_by' => $request->user()->id,
                'verified_at' => now(),
                'rejection_reason' => $approved ? null : $request->input('reason'),
            ]);

            if ($approved) {
                $voucher->update(['status' => Voucher::STATUS_PAID]);
                $cycle->update(['status' => BookingCycle::STATUS_PAID]);

                if ($booking->status === Booking::STATUS_APPROVED) {
                    $booking->update(['status' => Booking::STATUS_ACTIVE]);
                    $booking->bed?->update(['status' => Bed::STATUS_OCCUPIED]);
                }

                return;
            }

            // Rejected: reopen the voucher for re-upload and release the held bed.
            $booking->bed?->update(['status' => Bed::STATUS_AVAILABLE]);
        });

        $this->auditLog->log(
            $request->user(),
            $booking->hotel_id,
            'payment.'.$payment->fresh()->status,
            $payment,
            ['status' => 'pending'],
            ['status' => $payment->fresh()->status]
        );

        return response()->json($payment->fresh());
    }

    private function authorizeManage(User $actor, Booking $booking): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $booking->hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $booking->hotel_id),
            403
        );
    }
}
