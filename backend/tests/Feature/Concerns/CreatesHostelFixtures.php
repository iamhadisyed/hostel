<?php

namespace Tests\Feature\Concerns;

use App\Models\Bed;
use App\Models\Floor;
use App\Models\Hotel;
use App\Models\Room;
use App\Models\RoomType;
use App\Models\User;

trait CreatesHostelFixtures
{
    protected function makeSuperAdmin(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => User::ROLE_SUPER_ADMIN,
            'email_verified_at' => now(),
        ], $attributes));
    }

    protected function makeOwner(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => User::ROLE_OWNER,
            'email_verified_at' => now(),
        ], $attributes));
    }

    /**
     * Creates a hotel with one room type, one floor, one room, and $bedCount beds.
     */
    protected function makeHotelWithBeds(?User $owner = null, int $bedCount = 2, float $monthlyPrice = 8000): array
    {
        $owner ??= $this->makeOwner();

        $hotel = Hotel::create([
            'owner_id' => $owner->id,
            'name' => 'Test Hostel',
            'building_type' => 'flat',
            'city' => 'Lahore',
            'floor_count' => 1,
        ]);

        $floor = Floor::create(['hotel_id' => $hotel->id, 'number' => 1]);

        $roomType = RoomType::create([
            'hotel_id' => $hotel->id,
            'name' => 'Dorm-'.$bedCount,
            'default_capacity' => $bedCount,
            'monthly_price' => $monthlyPrice,
        ]);

        $room = Room::create([
            'hotel_id' => $hotel->id,
            'floor_id' => $floor->id,
            'room_type_id' => $roomType->id,
            'room_number' => '101',
            'capacity' => $bedCount,
        ]);

        $beds = collect(range(1, $bedCount))->map(fn ($i) => Bed::create([
            'hotel_id' => $hotel->id,
            'room_id' => $room->id,
            'bed_number' => chr(64 + $i),
        ]));

        return compact('owner', 'hotel', 'floor', 'roomType', 'room', 'beds');
    }

    protected function makeWarden(Hotel $hotel, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => User::ROLE_WARDEN,
            'hotel_id' => $hotel->id,
            'email_verified_at' => now(),
        ], $attributes));
    }

    protected function makeFrontDesk(Hotel $hotel, array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => User::ROLE_FRONT_DESK,
            'hotel_id' => $hotel->id,
            'email_verified_at' => now(),
        ], $attributes));
    }

    protected function makeVerifiedStudent(array $attributes = []): User
    {
        return User::factory()->create(array_merge([
            'role' => User::ROLE_STUDENT,
            'email_verified_at' => now(),
        ], $attributes));
    }

    protected function fakeUploadedFile(string $name = 'proof.jpg'): \Illuminate\Http\UploadedFile
    {
        return \Illuminate\Http\UploadedFile::fake()->image($name);
    }
}
