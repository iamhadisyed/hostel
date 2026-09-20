<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\BookingCycle;
use App\Models\Voucher;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class ManageVoucherCyclesCommandTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_it_generates_the_next_cycle_for_an_active_booking_nearing_its_cycle_end(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(monthlyPrice: 5000);
        $guest = $this->makeVerifiedStudent();
        $bed = $beds[0];
        $bed->update(['status' => Bed::STATUS_OCCUPIED]);

        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp', 'is_recurring' => true,
        ]);
        $cycle = BookingCycle::create([
            'booking_id' => $booking->id,
            'period_start' => now()->subDays(28),
            'period_end' => now()->addDays(2),
            'amount' => 5000,
            'status' => BookingCycle::STATUS_PAID,
        ]);
        Voucher::create([
            'booking_cycle_id' => $cycle->id, 'voucher_number' => 'VOLD1', 'amount' => 5000,
            'due_date' => now()->subDays(20), 'status' => Voucher::STATUS_PAID,
        ]);

        $this->artisan('vouchers:manage-cycles')->assertSuccessful();

        $this->assertSame(2, $booking->cycles()->count());
        $newCycle = $booking->cycles()->latest('period_end')->first();
        $this->assertSame($cycle->period_end->addDay()->toDateString(), $newCycle->period_start->toDateString());
        $this->assertSame('pending_payment', $newCycle->status);
        $this->assertNotNull($newCycle->voucher);
    }

    public function test_it_does_not_duplicate_a_cycle_that_already_exists(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(monthlyPrice: 5000);
        $guest = $this->makeVerifiedStudent();
        $bed = $beds[0];
        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp', 'is_recurring' => true,
        ]);
        $cycle = BookingCycle::create([
            'booking_id' => $booking->id, 'period_start' => now()->subDays(28), 'period_end' => now()->addDays(2),
            'amount' => 5000, 'status' => BookingCycle::STATUS_PAID,
        ]);
        Voucher::create(['booking_cycle_id' => $cycle->id, 'voucher_number' => 'VOLD1', 'amount' => 5000, 'due_date' => now()->subDays(20), 'status' => Voucher::STATUS_PAID]);
        // A next cycle already exists.
        BookingCycle::create([
            'booking_id' => $booking->id, 'period_start' => now()->addDays(3), 'period_end' => now()->addDays(32),
            'amount' => 5000, 'status' => BookingCycle::STATUS_PENDING_PAYMENT,
        ]);

        $this->artisan('vouchers:manage-cycles')->assertSuccessful();

        $this->assertSame(2, $booking->cycles()->count());
    }

    public function test_it_expires_an_overdue_unpaid_voucher_and_rejects_a_never_activated_booking(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(monthlyPrice: 5000);
        $guest = $this->makeVerifiedStudent();
        $bed = $beds[0];
        $bed->update(['status' => Bed::STATUS_HELD]);

        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_APPROVED,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp', 'is_recurring' => true,
        ]);
        $cycle = BookingCycle::create([
            'booking_id' => $booking->id, 'period_start' => now()->subDays(10), 'period_end' => now()->addDays(20),
            'amount' => 5000, 'status' => BookingCycle::STATUS_PENDING_PAYMENT,
        ]);
        $voucher = Voucher::create([
            'booking_cycle_id' => $cycle->id, 'voucher_number' => 'VOLD2', 'amount' => 5000,
            'due_date' => now()->subDays(2), 'status' => Voucher::STATUS_PENDING,
        ]);

        $this->artisan('vouchers:manage-cycles')->assertSuccessful();

        $this->assertSame(Voucher::STATUS_EXPIRED, $voucher->fresh()->status);
        $this->assertSame(BookingCycle::STATUS_EXPIRED, $cycle->fresh()->status);
        $this->assertSame(Booking::STATUS_REJECTED, $booking->fresh()->status);
        $this->assertSame(Bed::STATUS_AVAILABLE, $bed->fresh()->status);
    }

    public function test_it_does_not_evict_an_active_stay_whose_renewal_voucher_lapsed(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds(monthlyPrice: 5000);
        $guest = $this->makeVerifiedStudent();
        $bed = $beds[0];
        $bed->update(['status' => Bed::STATUS_OCCUPIED]);

        $booking = Booking::create([
            'hotel_id' => $hotel->id, 'user_id' => $guest->id, 'room_type_id' => $roomType->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp', 'is_recurring' => true,
        ]);
        // First cycle already paid and activated the stay.
        $firstCycle = BookingCycle::create([
            'booking_id' => $booking->id, 'period_start' => now()->subDays(60), 'period_end' => now()->subDays(30),
            'amount' => 5000, 'status' => BookingCycle::STATUS_PAID,
        ]);
        Voucher::create(['booking_cycle_id' => $firstCycle->id, 'voucher_number' => 'VPAID', 'amount' => 5000, 'due_date' => now()->subDays(50), 'status' => Voucher::STATUS_PAID]);
        // Renewal cycle's voucher lapsed unpaid.
        $renewalCycle = BookingCycle::create([
            'booking_id' => $booking->id, 'period_start' => now()->subDays(29), 'period_end' => now()->addDay(),
            'amount' => 5000, 'status' => BookingCycle::STATUS_PENDING_PAYMENT,
        ]);
        $renewalVoucher = Voucher::create([
            'booking_cycle_id' => $renewalCycle->id, 'voucher_number' => 'VLAPSED', 'amount' => 5000,
            'due_date' => now()->subDays(2), 'status' => Voucher::STATUS_PENDING,
        ]);

        $this->artisan('vouchers:manage-cycles')->assertSuccessful();

        $this->assertSame(Voucher::STATUS_EXPIRED, $renewalVoucher->fresh()->status);
        $this->assertSame(Booking::STATUS_ACTIVE, $booking->fresh()->status, 'a lapsed renewal must not evict an active stay');
        $this->assertSame(Bed::STATUS_OCCUPIED, $bed->fresh()->status);
    }
}
