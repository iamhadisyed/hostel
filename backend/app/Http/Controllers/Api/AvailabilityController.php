<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bed;
use App\Models\Hotel;
use Illuminate\Http\JsonResponse;

class AvailabilityController extends Controller
{
    /**
     * Public, read-only room/seat availability - visible even to guests
     * who have not registered or verified their email yet.
     */
    public function show(Hotel $hotel): JsonResponse
    {
        $roomTypes = $hotel->roomTypes()
            ->with(['rooms.beds' => function ($query) {
                $query->select('id', 'room_id', 'bed_number', 'status');
            }])
            ->get()
            ->map(function ($roomType) {
                $beds = $roomType->rooms->flatMap->beds;

                return [
                    'id' => $roomType->id,
                    'name' => $roomType->name,
                    'monthly_price' => $roomType->monthly_price,
                    'description' => $roomType->description,
                    'total_beds' => $beds->count(),
                    'available_beds' => $beds->where('status', Bed::STATUS_AVAILABLE)->count(),
                    'rooms' => $roomType->rooms->map(fn ($room) => [
                        'id' => $room->id,
                        'room_number' => $room->room_number,
                        'beds' => $room->beds->map(fn ($bed) => [
                            'id' => $bed->id,
                            'bed_number' => $bed->bed_number,
                            'status' => $bed->status,
                        ]),
                    ]),
                ];
            });

        return response()->json([
            'hotel' => $hotel->only(['id', 'name', 'city', 'building_type']),
            'room_types' => $roomTypes,
        ]);
    }
}
