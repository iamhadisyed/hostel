<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Booking\CreateBookingRequest;
use App\Http\Requests\Booking\CreateWalkInBookingRequest;
use App\Models\Bed;
use App\Models\Booking;
use App\Models\Hotel;
use App\Models\User;
use App\Services\VoucherService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;

class BookingController extends Controller
{
    public function __construct(private readonly VoucherService $voucherService) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Booking::query()->with(['guest', 'room', 'bed', 'roomType']);

        if ($user->isStudent()) {
            $query->where('user_id', $user->id);
        } elseif ($user->isOwner()) {
            $query->whereHas('hotel', fn ($q) => $q->where('owner_id', $user->id));
        } elseif (! $user->isSuperAdmin()) {
            $query->where('hotel_id', $user->hotel_id);
        }

        return response()->json($query->latest()->get());
    }

    public function show(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeView($request->user(), $booking);

        return response()->json($booking->load(['guest', 'room', 'bed', 'roomType', 'cycles.voucher.payments']));
    }

    /**
     * Guest self-registration: creates the booking against the currently
     * authenticated user and holds the selected bed.
     */
    public function store(CreateBookingRequest $request): JsonResponse
    {
        $booking = DB::transaction(function () use ($request) {
            $bed = $this->lockAndHoldBed($request->integer('bed_id'), $request->integer('hotel_id'));

            return Booking::create([
                'hotel_id' => $request->integer('hotel_id'),
                'user_id' => $request->user()->id,
                'room_type_id' => $request->integer('room_type_id'),
                'room_id' => $bed->room_id,
                'bed_id' => $bed->id,
                'status' => Booking::STATUS_PENDING,
                'created_by' => Booking::CREATED_BY_SELF,
                'verification_method' => 'otp',
                'check_in_date' => $request->input('check_in_date'),
            ]);
        });

        return response()->json($booking->load(['room', 'bed']), 201);
    }

    /**
     * Front Desk / Warden / Owner register a walk-in guest and create a
     * booking on their behalf. In-person CNIC verification substitutes
     * for OTP, so this booking is marked verified immediately - it still
     * requires Warden/Owner approval before a voucher is issued.
     */
    public function storeWalkIn(CreateWalkInBookingRequest $request): JsonResponse
    {
        $actor = $request->user();

        abort_unless(
            in_array($actor->role, [User::ROLE_FRONT_DESK, User::ROLE_WARDEN, User::ROLE_OWNER, User::ROLE_SUPER_ADMIN], true),
            403
        );

        $booking = DB::transaction(function () use ($request, $actor) {
            $bed = $this->lockAndHoldBed($request->integer('bed_id'), $request->integer('hotel_id'));

            $guest = User::create([
                'name' => $request->input('guest.name'),
                'email' => $request->input('guest.email'),
                'password' => Str::random(24),
                'phone' => $request->input('guest.phone'),
                'cnic' => $request->input('guest.cnic'),
                'role' => User::ROLE_STUDENT,
                'hotel_id' => $request->integer('hotel_id'),
                'email_verified_at' => now(),
            ]);

            $createdByMap = [
                User::ROLE_FRONT_DESK => Booking::CREATED_BY_FRONT_DESK,
                User::ROLE_WARDEN => Booking::CREATED_BY_WARDEN,
                User::ROLE_OWNER => Booking::CREATED_BY_OWNER,
                User::ROLE_SUPER_ADMIN => Booking::CREATED_BY_OWNER,
            ];

            return Booking::create([
                'hotel_id' => $request->integer('hotel_id'),
                'user_id' => $guest->id,
                'room_type_id' => $request->integer('room_type_id'),
                'room_id' => $bed->room_id,
                'bed_id' => $bed->id,
                'status' => Booking::STATUS_PENDING,
                'created_by' => $createdByMap[$actor->role],
                'verification_method' => 'in_person',
                'check_in_date' => $request->input('check_in_date'),
            ]);
        });

        return response()->json($booking->load(['guest', 'room', 'bed']), 201);
    }

    public function approve(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking->hotel);

        abort_unless($booking->status === Booking::STATUS_PENDING, 422, 'Only pending bookings can be approved.');

        $cycle = DB::transaction(function () use ($booking, $request) {
            $booking->update([
                'status' => Booking::STATUS_APPROVED,
                'approved_by' => $request->user()->id,
                'approved_at' => now(),
            ]);

            return $this->voucherService->createNextCycle($booking);
        });

        return response()->json($booking->fresh()->load('cycles.voucher'));
    }

    public function reject(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking->hotel);

        abort_unless($booking->status === Booking::STATUS_PENDING, 422, 'Only pending bookings can be rejected.');

        $request->validate(['reason' => ['nullable', 'string']]);

        DB::transaction(function () use ($booking, $request) {
            $booking->update([
                'status' => Booking::STATUS_REJECTED,
                'rejected_by' => $request->user()->id,
                'rejected_at' => now(),
                'rejection_reason' => $request->input('reason'),
            ]);

            $booking->bed?->update(['status' => Bed::STATUS_AVAILABLE]);
        });

        return response()->json($booking->fresh());
    }

    public function reassignBed(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking->hotel);

        $request->validate(['bed_id' => ['required', 'exists:beds,id']]);

        DB::transaction(function () use ($booking, $request) {
            $newBed = $this->lockAndHoldBed($request->integer('bed_id'), $booking->hotel_id);

            $booking->bed?->update(['status' => Bed::STATUS_AVAILABLE]);

            $booking->update([
                'bed_id' => $newBed->id,
                'room_id' => $newBed->room_id,
            ]);

            if ($booking->status === Booking::STATUS_ACTIVE) {
                $newBed->update(['status' => Bed::STATUS_OCCUPIED]);
            }
        });

        return response()->json($booking->fresh()->load(['room', 'bed']));
    }

    public function renewCycle(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking->hotel);

        abort_unless($booking->is_recurring, 422, 'This booking is not on a recurring monthly cycle.');
        abort_unless(in_array($booking->status, [Booking::STATUS_ACTIVE, Booking::STATUS_APPROVED], true), 422);

        $cycle = $this->voucherService->createNextCycle($booking);

        return response()->json($cycle, 201);
    }

    public function checkout(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking->hotel);

        abort_unless($booking->status === Booking::STATUS_ACTIVE, 422, 'Only active bookings can be checked out.');

        DB::transaction(function () use ($booking, $request) {
            $booking->update([
                'status' => Booking::STATUS_CHECKED_OUT,
                'checked_out_by' => $request->user()->id,
                'checked_out_at' => now(),
            ]);

            $booking->bed?->update(['status' => Bed::STATUS_AVAILABLE]);
        });

        return response()->json($booking->fresh());
    }

    private function lockAndHoldBed(int $bedId, int $hotelId): Bed
    {
        $bed = Bed::where('id', $bedId)->where('hotel_id', $hotelId)->lockForUpdate()->first();

        if (! $bed) {
            throw ValidationException::withMessages(['bed_id' => ['Bed not found for this hotel.']]);
        }

        if ($bed->status !== Bed::STATUS_AVAILABLE) {
            throw ValidationException::withMessages(['bed_id' => ['This bed is no longer available.']]);
        }

        $bed->update(['status' => Bed::STATUS_HELD]);

        return $bed;
    }

    private function authorizeView(User $actor, Booking $booking): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || $actor->id === $booking->user_id
                || ($actor->isOwner() && $booking->hotel->owner_id === $actor->id)
                || ($actor->hotel_id === $booking->hotel_id),
            403
        );
    }

    private function authorizeManage(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $hotel->id),
            403
        );
    }
}
