<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\Payment;
use App\Models\User;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class BookingFlowTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_a_verified_guest_can_request_a_specific_bed_and_it_is_held(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $guest = $this->makeVerifiedStudent();

        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotel->id,
            'room_type_id' => $roomType->id,
            'bed_id' => $beds[0]->id,
        ]);

        $response->assertStatus(201)->assertJsonPath('status', Booking::STATUS_PENDING);
        $this->assertSame(Bed::STATUS_HELD, $beds[0]->fresh()->status);
    }

    public function test_a_held_or_occupied_bed_cannot_be_double_booked(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $beds[0]->update(['status' => Bed::STATUS_HELD]);
        $guest = $this->makeVerifiedStudent();

        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotel->id,
            'room_type_id' => $roomType->id,
            'bed_id' => $beds[0]->id,
        ]);

        $response->assertStatus(422);
    }

    public function test_approving_a_booking_generates_a_cycle_and_voucher(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(monthlyPrice: 8000);
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/approve");

        $response->assertStatus(200)->assertJsonPath('status', Booking::STATUS_APPROVED);
        $this->assertDatabaseCount('booking_cycles', 1);
        $this->assertDatabaseHas('vouchers', ['amount' => '8000.00', 'status' => 'pending']);
    }

    public function test_approval_is_blocked_for_a_self_registered_guest_who_has_not_verified_email(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = User::factory()->unverified()->create(['role' => User::ROLE_STUDENT]);
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/approve");

        $response->assertStatus(422);
        $this->assertSame(Booking::STATUS_PENDING, $booking->fresh()->status);
        $this->assertDatabaseCount('vouchers', 0);
    }

    public function test_walk_in_booking_is_not_blocked_by_email_verification(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($hotel);
        $warden = $this->makeWarden($hotel);

        $walkIn = $this->actingAs($frontDesk, 'sanctum')->postJson('/api/bookings/walk-in', [
            'hotel_id' => $hotel->id,
            'room_type_id' => $roomType->id,
            'bed_id' => $beds[0]->id,
            'guest' => ['name' => 'Walk-in Wendy', 'phone' => '030011122233'],
        ]);

        $walkIn->assertStatus(201)->assertJsonPath('verification_method', 'in_person');
        $bookingId = $walkIn->json('id');

        $approve = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$bookingId}/approve");

        $approve->assertStatus(200);
        $this->assertDatabaseCount('vouchers', 1);
    }

    public function test_front_desk_cannot_approve_bookings(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($frontDesk, 'sanctum')->patchJson("/api/bookings/{$booking->id}/approve");

        $response->assertStatus(403);
    }

    public function test_rejecting_a_pending_booking_releases_the_held_bed(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $beds[0]->update(['status' => Bed::STATUS_HELD]);
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/reject", [
            'reason' => 'Duplicate request',
        ]);

        $response->assertStatus(200)->assertJsonPath('status', Booking::STATUS_REJECTED);
        $this->assertSame(Bed::STATUS_AVAILABLE, $beds[0]->fresh()->status);
    }

    private function approvedBookingWithVoucher(): array
    {
        $fixtures = $this->makeHotelWithBeds(monthlyPrice: 8000);
        $warden = $this->makeWarden($fixtures['hotel']);
        $guest = $this->makeVerifiedStudent();
        $bed = $fixtures['beds'][0];

        $booking = Booking::create([
            'hotel_id' => $fixtures['hotel']->id, 'user_id' => $guest->id, 'room_type_id' => $fixtures['roomType']->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $bed->update(['status' => Bed::STATUS_HELD]);

        $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/approve")->assertStatus(200);

        $voucher = Voucher::first();

        return compact('fixtures', 'warden', 'guest', 'bed', 'booking', 'voucher');
    }

    public function test_guest_can_upload_payment_proof_and_warden_can_approve_it(): void
    {
        ['warden' => $warden, 'guest' => $guest, 'bed' => $bed, 'booking' => $booking, 'voucher' => $voucher] = $this->approvedBookingWithVoucher();

        $upload = $this->actingAs($guest, 'sanctum')->post("/api/vouchers/{$voucher->id}/payments", [
            'file' => $this->fakeUploadedFile(),
        ]);
        $upload->assertStatus(201);

        $payment = Payment::first();

        $verify = $this->actingAs($warden, 'sanctum')->patchJson("/api/payments/{$payment->id}/verify", [
            'decision' => 'approved',
        ]);

        $verify->assertStatus(200)->assertJsonPath('status', 'approved');
        $this->assertSame(Booking::STATUS_ACTIVE, $booking->fresh()->status);
        $this->assertSame(Bed::STATUS_OCCUPIED, $bed->fresh()->status);
        $this->assertSame('paid', $voucher->fresh()->status);
    }

    public function test_rejecting_payment_reopens_the_voucher_and_releases_the_bed(): void
    {
        ['warden' => $warden, 'guest' => $guest, 'bed' => $bed, 'booking' => $booking, 'voucher' => $voucher] = $this->approvedBookingWithVoucher();

        $this->actingAs($guest, 'sanctum')->post("/api/vouchers/{$voucher->id}/payments", [
            'file' => $this->fakeUploadedFile(),
        ])->assertStatus(201);

        $payment = Payment::first();

        $verify = $this->actingAs($warden, 'sanctum')->patchJson("/api/payments/{$payment->id}/verify", [
            'decision' => 'rejected',
            'reason' => 'Blurry proof',
        ]);

        $verify->assertStatus(200)->assertJsonPath('status', 'rejected');
        $this->assertSame(Bed::STATUS_AVAILABLE, $bed->fresh()->status);
        $this->assertSame(Booking::STATUS_APPROVED, $booking->fresh()->status);
        $this->assertSame('pending', $voucher->fresh()->status, 'voucher should remain open for re-upload');
    }

    public function test_a_guest_cannot_upload_proof_for_someone_elses_voucher(): void
    {
        ['voucher' => $voucher] = $this->approvedBookingWithVoucher();
        $otherGuest = $this->makeVerifiedStudent();

        $response = $this->actingAs($otherGuest, 'sanctum')->post("/api/vouchers/{$voucher->id}/payments", [
            'file' => $this->fakeUploadedFile(),
        ]);

        $response->assertStatus(403);
    }

    public function test_checkout_releases_the_bed_and_requires_active_status(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $beds[0]->update(['status' => Bed::STATUS_OCCUPIED]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/checkout");

        $response->assertStatus(200)->assertJsonPath('status', Booking::STATUS_CHECKED_OUT);
        $this->assertSame(Bed::STATUS_AVAILABLE, $beds[0]->fresh()->status);
    }

    public function test_checkout_is_rejected_for_a_non_active_booking(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/checkout");

        $response->assertStatus(422);
    }

    public function test_bed_can_be_reassigned(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(bedCount: 2);
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $beds[0]->room_id, 'bed_id' => $beds[0]->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $beds[0]->update(['status' => Bed::STATUS_OCCUPIED]);

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/reassign-bed", [
            'bed_id' => $beds[1]->id,
        ]);

        $response->assertStatus(200)->assertJsonPath('bed_id', $beds[1]->id);
        $this->assertSame(Bed::STATUS_AVAILABLE, $beds[0]->fresh()->status);
        $this->assertSame(Bed::STATUS_OCCUPIED, $beds[1]->fresh()->status);
    }
}
