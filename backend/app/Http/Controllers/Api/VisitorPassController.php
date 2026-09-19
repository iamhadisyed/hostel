<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Hotel;
use App\Models\User;
use App\Models\VisitorPass;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class VisitorPassController extends Controller
{
    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);

        return response()->json($hotel->visitorPasses()->with('hostBooking.guest')->latest('checked_in_at')->get());
    }

    public function store(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);

        $data = $request->validate([
            'visitor_name' => ['required', 'string', 'max:255'],
            'cnic' => ['nullable', 'string', 'max:30'],
            'phone' => ['nullable', 'string', 'max:30'],
            'host_booking_id' => ['nullable', 'exists:bookings,id'],
            'purpose' => ['nullable', 'string'],
        ]);

        $pass = $hotel->visitorPasses()->create($data + [
            'checked_in_at' => now(),
            'logged_by' => $request->user()->id,
        ]);

        return response()->json($pass, 201);
    }

    public function checkout(Request $request, Hotel $hotel, VisitorPass $visitorPass): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);
        abort_unless($visitorPass->hotel_id === $hotel->id, 404);
        abort_if($visitorPass->checked_out_at, 422, 'Visitor already checked out.');

        $visitorPass->update(['checked_out_at' => now()]);

        return response()->json($visitorPass->fresh());
    }

    private function authorizeManage(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || (in_array($actor->role, [User::ROLE_WARDEN, User::ROLE_FRONT_DESK], true) && $actor->hotel_id === $hotel->id),
            403
        );
    }
}
