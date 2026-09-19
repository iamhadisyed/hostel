<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Booking;
use App\Models\Feedback;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class FeedbackController extends Controller
{
    public function store(Request $request, Booking $booking): JsonResponse
    {
        abort_unless($request->user()->id === $booking->user_id, 403);

        abort_unless(
            in_array($booking->status, [Booking::STATUS_ACTIVE, Booking::STATUS_CHECKED_OUT], true),
            422,
            'Feedback can be left during an active stay or after checkout.'
        );

        $data = $request->validate([
            'rating' => ['required', 'integer', 'min:1', 'max:5'],
            'comment' => ['nullable', 'string'],
        ]);

        $feedback = $booking->feedback()->updateOrCreate(
            ['booking_id' => $booking->id],
            [
                'hotel_id' => $booking->hotel_id,
                'room_id' => $booking->room_id,
                'rating' => $data['rating'],
                'comment' => $data['comment'] ?? null,
            ]
        );

        return response()->json($feedback, 201);
    }

    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeView($request->user(), $hotel);

        $feedback = $hotel->feedback()->with(['booking.guest', 'room'])->latest()->get();

        return response()->json([
            'average_rating' => round($feedback->avg('rating') ?? 0, 2),
            'count' => $feedback->count(),
            'by_room' => $feedback->groupBy('room_id')->map(fn ($group) => round($group->avg('rating'), 2)),
            'feedback' => $feedback,
        ]);
    }

    private function authorizeView(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $hotel->id),
            403
        );
    }
}
