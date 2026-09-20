<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class FrontDeskTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_front_desk_can_log_a_presence_check_in(): void
    {
        $fixtures = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($fixtures['hotel']);
        $guest = $this->makeVerifiedStudent();
        $bed = $fixtures['beds'][0];
        $booking = Booking::create([
            'hotel_id' => $fixtures['hotel']->id, 'user_id' => $guest->id, 'room_type_id' => $fixtures['roomType']->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($frontDesk, 'sanctum')->postJson("/api/bookings/{$booking->id}/presence", [
            'type' => 'check_in',
        ]);

        $response->assertStatus(201)->assertJsonPath('type', 'check_in');
    }

    public function test_front_desk_can_log_and_check_out_a_visitor(): void
    {
        $fixtures = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($fixtures['hotel']);

        $create = $this->actingAs($frontDesk, 'sanctum')->postJson("/api/hotels/{$fixtures['hotel']->id}/visitor-passes", [
            'visitor_name' => 'Uncle Tariq',
            'phone' => '03001112222',
            'purpose' => 'family visit',
        ]);
        $create->assertStatus(201);
        $passId = $create->json('id');

        $checkout = $this->actingAs($frontDesk, 'sanctum')->patchJson(
            "/api/hotels/{$fixtures['hotel']->id}/visitor-passes/{$passId}/checkout"
        );

        $checkout->assertStatus(200);
        $this->assertNotNull($checkout->json('checked_out_at'));
    }

    public function test_a_visitor_cannot_be_checked_out_twice(): void
    {
        $fixtures = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($fixtures['hotel']);
        $passId = $this->actingAs($frontDesk, 'sanctum')->postJson("/api/hotels/{$fixtures['hotel']->id}/visitor-passes", [
            'visitor_name' => 'Uncle Tariq',
        ])->json('id');
        $this->actingAs($frontDesk, 'sanctum')->patchJson("/api/hotels/{$fixtures['hotel']->id}/visitor-passes/{$passId}/checkout")->assertStatus(200);

        $second = $this->actingAs($frontDesk, 'sanctum')->patchJson("/api/hotels/{$fixtures['hotel']->id}/visitor-passes/{$passId}/checkout");

        $second->assertStatus(422);
    }

    public function test_front_desk_cannot_register_a_walk_in_for_a_different_hotel(): void
    {
        $fixtures = $this->makeHotelWithBeds();
        $otherFixtures = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($fixtures['hotel']);

        $response = $this->actingAs($frontDesk, 'sanctum')->postJson('/api/bookings/walk-in', [
            'hotel_id' => $otherFixtures['hotel']->id,
            'room_type_id' => $otherFixtures['roomType']->id,
            'bed_id' => $otherFixtures['beds'][0]->id,
            'guest' => ['name' => 'Sneaky Guest'],
        ]);

        $response->assertStatus(403);
    }
}
