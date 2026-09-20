<?php

namespace Tests\Feature;

use App\Models\Bed;
use App\Models\Booking;
use App\Models\MenuItem;
use App\Models\Order;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class FoodOrderTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    private function activeBooking(): array
    {
        $fixtures = $this->makeHotelWithBeds();
        $guest = $this->makeVerifiedStudent();
        $bed = $fixtures['beds'][0];
        $booking = Booking::create([
            'hotel_id' => $fixtures['hotel']->id, 'user_id' => $guest->id, 'room_type_id' => $fixtures['roomType']->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_ACTIVE,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $bed->update(['status' => Bed::STATUS_OCCUPIED]);

        return compact('fixtures', 'guest', 'bed', 'booking');
    }

    public function test_warden_can_manage_the_menu(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/hotels/{$hotel->id}/menu", [
            'name' => 'Chicken Biryani', 'price' => 350,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('menu_items', ['name' => 'Chicken Biryani', 'price' => '350.00']);
    }

    public function test_guest_can_place_a_tab_order_during_active_stay(): void
    {
        ['fixtures' => $fixtures, 'guest' => $guest, 'booking' => $booking] = $this->activeBooking();
        $item = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Tea', 'price' => 50]);

        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 2]],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('total', '100.00')
            ->assertJsonPath('payment_status', Order::PAYMENT_UNPAID);
    }

    public function test_guest_can_pay_for_an_order_immediately(): void
    {
        ['fixtures' => $fixtures, 'guest' => $guest, 'booking' => $booking] = $this->activeBooking();
        $item = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Tea', 'price' => 50]);

        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'pay_now' => true,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(201)->assertJsonPath('payment_status', Order::PAYMENT_PAID);
    }

    public function test_food_cannot_be_ordered_for_a_non_active_booking(): void
    {
        $fixtures = $this->makeHotelWithBeds();
        $guest = $this->makeVerifiedStudent();
        $bed = $fixtures['beds'][0];
        $booking = Booking::create([
            'hotel_id' => $fixtures['hotel']->id, 'user_id' => $guest->id, 'room_type_id' => $fixtures['roomType']->id,
            'room_id' => $bed->room_id, 'bed_id' => $bed->id, 'status' => Booking::STATUS_PENDING,
            'created_by' => Booking::CREATED_BY_SELF, 'verification_method' => 'otp',
        ]);
        $item = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Tea', 'price' => 50]);

        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ]);

        $response->assertStatus(422);
    }

    public function test_warden_can_update_order_fulfillment_status(): void
    {
        ['fixtures' => $fixtures, 'guest' => $guest, 'booking' => $booking] = $this->activeBooking();
        $warden = $this->makeWarden($fixtures['hotel']);
        $item = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Tea', 'price' => 50]);
        $orderId = $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'items' => [['menu_item_id' => $item->id, 'quantity' => 1]],
        ])->json('id');

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/orders/{$orderId}/status", [
            'status' => 'preparing',
        ]);

        $response->assertStatus(200)->assertJsonPath('status', 'preparing');
    }

    public function test_checkout_settles_only_unpaid_orders_into_the_food_bill(): void
    {
        ['fixtures' => $fixtures, 'guest' => $guest, 'booking' => $booking] = $this->activeBooking();
        $warden = $this->makeWarden($fixtures['hotel']);
        $biryani = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Biryani', 'price' => 350]);
        $tea = MenuItem::create(['hotel_id' => $fixtures['hotel']->id, 'name' => 'Tea', 'price' => 50]);

        $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'items' => [['menu_item_id' => $biryani->id, 'quantity' => 1]],
        ])->assertStatus(201); // unpaid tab: 350

        $this->actingAs($guest, 'sanctum')->postJson('/api/orders', [
            'booking_id' => $booking->id,
            'pay_now' => true,
            'items' => [['menu_item_id' => $tea->id, 'quantity' => 2]],
        ])->assertStatus(201); // already paid: 100

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/bookings/{$booking->id}/checkout");

        $response->assertStatus(200)->assertJsonPath('settled_food_bill', 350);
        $this->assertDatabaseMissing('orders', ['booking_id' => $booking->id, 'payment_status' => Order::PAYMENT_UNPAID]);
    }
}
