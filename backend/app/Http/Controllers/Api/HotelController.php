<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySetup\CreateHotelRequest;
use App\Models\Bed;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;
use App\Services\AuditLogService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class HotelController extends Controller
{
    public function __construct(private readonly AuditLogService $auditLog) {}

    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = Hotel::query()->with('owner');

        if ($user->isOwner()) {
            $query->where('owner_id', $user->id);
        } elseif ($user->isWarden() || $user->isFrontDesk()) {
            $query->where('id', $user->hotel_id);
        } elseif ($user->isStudent()) {
            // Guests browse all active properties before choosing where to book.
            $query->where('is_active', true);
        }

        return response()->json($query->get());
    }

    public function show(Hotel $hotel): JsonResponse
    {
        return response()->json($hotel->load(['owner', 'floors.rooms.beds', 'roomTypes']));
    }

    public function store(CreateHotelRequest $request): JsonResponse
    {
        $hotel = DB::transaction(function () use ($request) {
            $owner = $this->resolveOwner($request);

            $hotel = Hotel::create([
                'owner_id' => $owner->id,
                'name' => $request->string('name'),
                'building_type' => $request->string('building_type'),
                'address' => $request->input('address'),
                'city' => $request->input('city'),
                'floor_count' => $request->integer('floor_count'),
            ]);

            $roomTypesByName = collect($request->input('room_types'))
                ->mapWithKeys(function (array $type) use ($hotel) {
                    $roomType = RoomType::create([
                        'hotel_id' => $hotel->id,
                        'name' => $type['name'],
                        'default_capacity' => $type['default_capacity'],
                        'monthly_price' => $type['monthly_price'],
                        'description' => $type['description'] ?? null,
                    ]);

                    return [$type['name'] => $roomType];
                });

            foreach ($request->input('floors') as $floorData) {
                $floor = Floor::create([
                    'hotel_id' => $hotel->id,
                    'number' => $floorData['number'],
                    'name' => $floorData['name'] ?? null,
                ]);

                foreach ($floorData['rooms'] as $roomData) {
                    $roomType = $roomTypesByName->get($roomData['room_type']);

                    abort_if(! $roomType, 422, "Unknown room type [{$roomData['room_type']}] referenced by room {$roomData['room_number']}.");

                    $room = Room::create([
                        'hotel_id' => $hotel->id,
                        'floor_id' => $floor->id,
                        'room_type_id' => $roomType->id,
                        'room_number' => $roomData['room_number'],
                        'capacity' => $roomData['capacity'],
                    ]);

                    foreach (range(1, $roomData['capacity']) as $bedIndex) {
                        Bed::create([
                            'hotel_id' => $hotel->id,
                            'room_id' => $room->id,
                            'bed_number' => Str::upper(chr(64 + $bedIndex)), // A, B, C, ...
                        ]);
                    }
                }
            }

            return $hotel;
        });

        $this->auditLog->log($request->user(), $hotel->id, 'hotel.created', $hotel, [], ['name' => $hotel->name]);

        return response()->json($hotel->load(['owner', 'floors.rooms.beds', 'roomTypes']), 201);
    }

    private function resolveOwner(CreateHotelRequest $request): User
    {
        if ($request->filled('owner_id')) {
            $owner = User::findOrFail($request->integer('owner_id'));

            abort_unless($owner->isOwner() || $owner->role === User::ROLE_SUPER_ADMIN, 422, 'Selected user is not an Owner.');

            return $owner;
        }

        return User::create([
            'name' => $request->input('owner.name'),
            'email' => $request->input('owner.email'),
            'password' => $request->input('owner.password'),
            'phone' => $request->input('owner.phone'),
            'role' => User::ROLE_OWNER,
        ]);
    }
}
