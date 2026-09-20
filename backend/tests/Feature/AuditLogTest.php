<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class AuditLogTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_hotel_creation_is_audited(): void
    {
        $admin = $this->makeSuperAdmin();

        $this->actingAs($admin, 'sanctum')->postJson('/api/hotels', [
            'name' => 'Green Valley Hostel',
            'building_type' => 'flat',
            'floor_count' => 1,
            'owner' => ['name' => 'Owner Jane', 'email' => 'owner1@example.com', 'password' => 'password123'],
            'room_types' => [['name' => 'Dorm-4', 'default_capacity' => 4, 'monthly_price' => 8000]],
            'floors' => [['number' => 1, 'rooms' => [['room_number' => '101', 'room_type' => 'Dorm-4', 'capacity' => 4]]]],
        ])->assertStatus(201);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $admin->id,
            'action' => 'hotel.created',
            'auditable_type' => 'App\\Models\\Hotel',
        ]);
    }

    public function test_booking_approval_and_checkout_are_audited(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/approve")->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $warden->id,
            'action' => 'booking.approved',
            'auditable_id' => $booking->id,
        ]);

        $booking->update(['status' => Booking::STATUS_ACTIVE]);
        $beds[0]->update(['status' => Bed::STATUS_OCCUPIED]);

        $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/checkout")->assertStatus(200);

        $this->assertDatabaseHas('audit_logs', [
            'user_id' => $warden->id,
            'action' => 'booking.checked_out',
            'auditable_id' => $booking->id,
        ]);
    }

    public function test_owner_only_sees_audit_logs_for_their_own_hotels(): void
    {
        ['hotel' => $hotelA, 'owner' => $ownerA, 'roomType' => $roomTypeA, 'beds' => $bedsA] = $this->makeHotelWithBeds();
        ['hotel' => $hotelB] = $this->makeHotelWithBeds();
        $wardenA = $this->makeWarden($hotelA);
        $guestA = $this->makeVerifiedStudent();
        $bookingA = Booking::create([
            'hotel_id' => $hotelA->id, 'user_id' => $guestA->id, 'room_type_id' => $roomTypeA->id,
            'room_id' => $bedsA[0]->room_id, 'bed_id' => $bedsA[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $this->actingAs($wardenA, 'sanctum')->patchJson("/api/bookings/{$bookingA->id}/approve")->assertStatus(200);

        $response = $this->actingAs($ownerA, 'sanctum')->getJson('/api/audit-logs');

        $response->assertStatus(200);
        foreach ($response->json('data') as $entry) {
            $this->assertSame($hotelA->id, $entry['hotel_id']);
        }
    }

    public function test_warden_cannot_view_audit_logs(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->getJson('/api/audit-logs');

        $response->assertStatus(403);
    }
}
