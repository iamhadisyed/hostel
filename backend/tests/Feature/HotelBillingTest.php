<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Carbon;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class HotelBillingTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_hotel_with_no_subscription_reports_no_plan(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/hotels/{$hotel->id}/billing");

        $response->assertStatus(200)->assertJsonPath('status.status', 'no_plan');
    }

    public function test_super_admin_can_set_billing_terms(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $response = $this->actingAs($admin, 'sanctum')->putJson("/api/hotels/{$hotel->id}/billing", [
            'onboarding_fee' => 50000,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today()->toDateString(),
        ]);

        $response->assertStatus(200)->assertJsonPath('subscription.recurring_amount', '5000.00');
        $this->assertDatabaseHas('hotel_subscriptions', ['hotel_id' => $hotel->id, 'billing_cycle' => 'monthly']);
    }

    public function test_owner_cannot_set_billing_terms(): void
    {
        ['owner' => $owner, 'hotel' => $hotel] = $this->makeHotelWithBeds();

        $response = $this->actingAs($owner, 'sanctum')->putJson("/api/hotels/{$hotel->id}/billing", [
            'onboarding_fee' => 50000,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today()->toDateString(),
        ]);

        $response->assertStatus(403);
    }

    public function test_unpaid_current_period_is_overdue(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $hotel->subscription()->create([
            'onboarding_fee' => 0,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today()->subMonths(2)->subDays(5),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/hotels/{$hotel->id}/billing");

        $response->assertStatus(200)->assertJsonPath('status.status', 'overdue');
        $this->assertGreaterThan(0, $response->json('status.days_overdue'));
    }

    public function test_recording_a_payment_for_the_current_period_clears_overdue_status(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $anchor = Carbon::today()->subMonths(2);

        $hotel->subscription()->create([
            'onboarding_fee' => 0,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => $anchor,
        ]);

        $billingResponse = $this->actingAs($admin, 'sanctum')->getJson("/api/hotels/{$hotel->id}/billing");
        $currentPeriodStart = $billingResponse->json('status.current_period_start');

        $response = $this->actingAs($admin, 'sanctum')->postJson("/api/hotels/{$hotel->id}/billing/payments", [
            'type' => 'recurring',
            'amount' => 5000,
            'paid_at' => Carbon::today()->toDateString(),
            'period_start' => $currentPeriodStart,
        ]);

        $response->assertStatus(201)->assertJsonPath('status.status', 'current');
        $this->assertDatabaseHas('hotel_billing_payments', ['hotel_id' => $hotel->id, 'type' => 'recurring']);
    }

    public function test_billing_anchor_in_the_future_reports_upcoming(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $hotel->subscription()->create([
            'onboarding_fee' => 0,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today()->addWeek(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson("/api/hotels/{$hotel->id}/billing");

        $response->assertStatus(200)->assertJsonPath('status.status', 'upcoming');
    }

    public function test_onboarding_payment_marks_onboarding_fee_paid(): void
    {
        $admin = $this->makeSuperAdmin();
        ['hotel' => $hotel] = $this->makeHotelWithBeds();

        $hotel->subscription()->create([
            'onboarding_fee' => 50000,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today(),
        ]);

        $this->actingAs($admin, 'sanctum')->postJson("/api/hotels/{$hotel->id}/billing/payments", [
            'type' => 'onboarding',
            'amount' => 50000,
            'paid_at' => Carbon::today()->toDateString(),
        ])->assertStatus(201);

        $this->assertNotNull($hotel->subscription->fresh()->onboarding_fee_paid_at);
    }

    public function test_billing_dashboard_lists_overdue_and_upcoming_properties(): void
    {
        $admin = $this->makeSuperAdmin();

        ['hotel' => $overdueHotel] = $this->makeHotelWithBeds();
        $overdueHotel->subscription()->create([
            'onboarding_fee' => 0,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 5000,
            'billing_anchor_date' => Carbon::today()->subMonths(1),
        ]);

        ['hotel' => $upcomingHotel] = $this->makeHotelWithBeds();
        $upcomingHotel->subscription()->create([
            'onboarding_fee' => 0,
            'billing_cycle' => 'monthly',
            'recurring_amount' => 3000,
            'billing_anchor_date' => Carbon::today()->addWeek(),
        ]);

        $response = $this->actingAs($admin, 'sanctum')->getJson('/api/super-admin/billing-dashboard');

        $response->assertStatus(200)
            ->assertJsonPath('summary.total_properties', 2)
            ->assertJsonPath('summary.overdue_count', 1)
            ->assertJsonPath('summary.upcoming_count', 1);
    }

    public function test_non_super_admin_cannot_view_billing_dashboard(): void
    {
        ['owner' => $owner] = $this->makeHotelWithBeds();

        $response = $this->actingAs($owner, 'sanctum')->getJson('/api/super-admin/billing-dashboard');

        $response->assertStatus(403);
    }
}
