<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class FeedbackTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    private function bookingWithStatus(string $status): array
    {
        $fixtures = $this->makeHotelWithBeds();
        $guest = $this->makeVerifiedStudent();
        $bed = $fixtures['beds'][0];
        $booking = Booking::create([
            'hotel_id' => $fixtures['hotel']->id, 'user_id' => $guest->id, 'room_type_id' => $fixtures['roomType']->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => $status,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        return compact('fixtures', 'guest', 'booking');
    }

    public function test_guest_can_leave_feedback_mid_stay(): void
    {
        ['guest' => $guest, 'booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_ACTIVE);

        $response = $this->actingAs($guest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", [
            'rating' => 4,
            'comment' => 'Good so far',
        ]);

        $response->assertStatus(201)->assertJsonPath('rating', 4);
    }

    public function test_guest_can_leave_feedback_after_checkout(): void
    {
        ['guest' => $guest, 'booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_CHECKED_OUT);

        $response = $this->actingAs($guest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", [
            'rating' => 5,
        ]);

        $response->assertStatus(201);
    }

    public function test_feedback_is_rejected_for_a_pending_booking(): void
    {
        ['guest' => $guest, 'booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_PENDING);

        $response = $this->actingAs($guest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", [
            'rating' => 5,
        ]);

        $response->assertStatus(422);
    }

    public function test_another_guest_cannot_leave_feedback_for_someone_elses_booking(): void
    {
        ['booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_ACTIVE);
        $otherGuest = $this->makeVerifiedStudent();

        $response = $this->actingAs($otherGuest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", [
            'rating' => 3,
        ]);

        $response->assertStatus(403);
    }

    public function test_warden_sees_average_rating_and_per_room_breakdown(): void
    {
        ['fixtures' => $fixtures, 'guest' => $guest, 'booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_ACTIVE);
        $warden = $this->makeWarden($fixtures['hotel']);
        $this->actingAs($guest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", ['rating' => 4]);

        $response = $this->actingAs($warden, 'sanctum')->getJson("/api/hotels/{$fixtures['hotel']->id}/feedback");

        $response->assertStatus(200)
            ->assertJsonPath('average_rating', 4)
            ->assertJsonPath('count', 1);
    }

    public function test_rating_must_be_between_1_and_5(): void
    {
        ['guest' => $guest, 'booking' => $booking] = $this->bookingWithStatus(Booking::STATUS_ACTIVE);

        $response = $this->actingAs($guest, 'sanctum')->postJson("/api/bookings/{$booking->id}/feedback", [
            'rating' => 6,
        ]);

        $response->assertStatus(422);
    }
}
