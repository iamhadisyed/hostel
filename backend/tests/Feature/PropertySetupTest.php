<?php

namespace Tests\Feature;

use App\Models\Hotel;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class PropertySetupTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    private function wizardPayload(): array
    {
        return [
            'name' => 'Green Valley Hostel',
            'building_type' => 'flat',
            'city' => 'Lahore',
            'floor_count' => 1,
            'owner' => [
                'name' => 'Owner Jane',
                'email' => 'owner1@example.com',
                'password' => 'password123',
            ],
            'room_types' => [
                ['name' => 'Dorm-4', 'default_capacity' => 4, 'monthly_price' => 8000],
            ],
            'floors' => [
                [
                    'number' => 1,
                    'rooms' => [
                        ['room_number' => '101', 'room_type' => 'Dorm-4', 'capacity' => 4],
                    ],
                ],
            ],
        ];
    }

    public function test_super_admin_can_onboard_a_property_with_a_new_owner(): void
    {
        $admin = $this->makeSuperAdmin();

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/hotels', $this->wizardPayload());

        $response->assertStatus(201)
            ->assertJsonPath('name', 'Green Valley Hostel')
            ->assertJsonPath('owner.email', 'owner1@example.com')
            ->assertJsonCount(1, 'room_types')
            ->assertJsonCount(1, 'floors.0.rooms');

        $this->assertDatabaseHas('users', ['email' => 'owner1@example.com', 'role' => User::ROLE_OWNER]);
        $this->assertDatabaseCount('rooms', 1);
        $this->assertDatabaseCount('beds', 4);

        foreach (range('A', 'D') as $letter) {
            $this->assertDatabaseHas('beds', ['bed_number' => $letter, 'status' => 'available']);
        }
    }

    public function test_super_admin_can_attach_an_existing_owner(): void
    {
        $admin = $this->makeSuperAdmin();
        $owner = $this->makeOwner();

        $payload = $this->wizardPayload();
        unset($payload['owner']);
        $payload['owner_id'] = $owner->id;

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/hotels', $payload);

        $response->assertStatus(201)->assertJsonPath('owner_id', $owner->id);
        $this->assertDatabaseCount('users', 2); // admin + owner, no new user created
    }

    public function test_non_super_admin_cannot_create_a_hotel(): void
    {
        $owner = $this->makeOwner();

        $response = $this->actingAs($owner, 'sanctum')->postJson('/api/hotels', $this->wizardPayload());

        $response->assertStatus(403);
    }

    public function test_unknown_room_type_reference_is_rejected(): void
    {
        $admin = $this->makeSuperAdmin();

        $payload = $this->wizardPayload();
        $payload['floors'][0]['rooms'][0]['room_type'] = 'Nonexistent';

        $response = $this->actingAs($admin, 'sanctum')->postJson('/api/hotels', $payload);

        $response->assertStatus(422);
        $this->assertDatabaseCount('hotels', 0);
    }

    public function test_owner_sees_only_their_own_hotels(): void
    {
        ['owner' => $ownerA, 'hotel' => $hotelA] = $this->makeHotelWithBeds();
        ['owner' => $ownerB] = $this->makeHotelWithBeds();

        $response = $this->actingAs($ownerA, 'sanctum')->getJson('/api/hotels');

        $response->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.id', $hotelA->id);
    }

    public function test_student_sees_all_active_hotels_for_browsing(): void
    {
        $this->makeHotelWithBeds();
        $this->makeHotelWithBeds();
        $student = $this->makeVerifiedStudent();

        $response = $this->actingAs($student, 'sanctum')->getJson('/api/hotels');

        $response->assertStatus(200)->assertJsonCount(2);
    }

    public function test_owner_can_create_a_warden_account(): void
    {
        ['owner' => $owner, 'hotel' => $hotel] = $this->makeHotelWithBeds();

        $response = $this->actingAs($owner, 'sanctum')->postJson("/api/hotels/{$hotel->id}/accounts", [
            'name' => 'Warden Bob',
            'email' => 'warden@example.com',
            'password' => 'password123',
            'role' => 'warden',
        ]);

        $response->assertStatus(201)->assertJsonPath('hotel_id', $hotel->id);
        $this->assertDatabaseHas('users', ['email' => 'warden@example.com', 'role' => 'warden', 'hotel_id' => $hotel->id]);
    }

    public function test_owner_cannot_create_an_account_for_another_owners_hotel(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $otherOwner = $this->makeOwner();

        $response = $this->actingAs($otherOwner, 'sanctum')->postJson("/api/hotels/{$hotel->id}/accounts", [
            'name' => 'Warden Bob',
            'email' => 'warden@example.com',
            'password' => 'password123',
            'role' => 'warden',
        ]);

        $response->assertStatus(403);
    }

    public function test_warden_cannot_create_hotel_accounts(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/hotels/{$hotel->id}/accounts", [
            'name' => 'Front Desk Ali',
            'email' => 'fd@example.com',
            'password' => 'password123',
            'role' => 'front_desk',
        ]);

        $response->assertStatus(403);
    }

    public function test_owner_can_deactivate_an_account(): void
    {
        ['owner' => $owner, 'hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($owner, 'sanctum')->deleteJson("/api/hotels/{$hotel->id}/accounts/{$warden->id}");

        $response->assertStatus(200);
        $this->assertFalse($warden->fresh()->is_active);
    }
}
