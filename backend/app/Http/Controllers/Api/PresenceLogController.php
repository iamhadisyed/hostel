<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\PresenceLog;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class PresenceLogController extends Controller
{
    public function index(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking);

        return response()->json($booking->presenceLogs()->latest('logged_at')->get());
    }

    public function store(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeManage($request->user(), $booking);

        $data = $request->validate([
            'type' => ['required', Rule::in([PresenceLog::TYPE_CHECK_IN, PresenceLog::TYPE_CHECK_OUT])],
            'logged_at' => ['nullable', 'date'],
        ]);

        $log = $booking->presenceLogs()->create([
            'type' => $data['type'],
            'logged_at' => $data['logged_at'] ?? now(),
            'logged_by' => $request->user()->id,
        ]);

        return response()->json($log, 201);
    }

    private function authorizeManage(User $actor, Booking $booking): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $booking->hotel->owner_id === $actor->id)
                || (in_array($actor->role, [User::ROLE_WARDEN, User::ROLE_FRONT_DESK], true) && $actor->hotel_id === $booking->hotel_id),
            403
        );
    }
}
