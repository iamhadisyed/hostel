<?php

namespace Tests\Feature;

use App\Models\Expense;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class ExpenseTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_warden_can_log_an_expense(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);

        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->post("/api/hotels/{$hotel->id}/expenses", [
            'category' => 'utility',
            'vendor' => 'WAPDA',
            'amount' => 3000,
            'date' => '2026-09-10',
            'receipt' => $this->fakeUploadedFile('receipt.jpg'),
        ]);

        $response->assertStatus(201)->assertJsonPath('status', Expense::STATUS_PENDING);
        $this->assertDatabaseHas('expenses', ['vendor' => 'WAPDA', 'amount' => '3000.00']);
    }

    public function test_only_owner_can_approve_expenses(): void
    {
        ['hotel' => $hotel, 'owner' => $owner] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $expense = Expense::create([
            'hotel_id' => $hotel->id, 'category' => 'utility', 'amount' => 3000,
            'date' => '2026-09-10', 'status' => Expense::STATUS_PENDING, 'logged_by' => $warden->id,
        ]);

        $wardenAttempt = $this->actingAs($warden, 'sanctum')->patchJson(
            "/api/hotels/{$hotel->id}/expenses/{$expense->id}/review",
            ['decision' => 'approved']
        );
        $wardenAttempt->assertStatus(403);

        $ownerAttempt = $this->actingAs($owner, 'sanctum')->patchJson(
            "/api/hotels/{$hotel->id}/expenses/{$expense->id}/review",
            ['decision' => 'approved']
        );
        $ownerAttempt->assertStatus(200)->assertJsonPath('status', 'approved');
    }

    public function test_an_already_reviewed_expense_cannot_be_reviewed_again(): void
    {
        ['hotel' => $hotel, 'owner' => $owner] = $this->makeHotelWithBeds();
        $expense = Expense::create([
            'hotel_id' => $hotel->id, 'category' => 'utility', 'amount' => 3000,
            'date' => '2026-09-10', 'status' => Expense::STATUS_APPROVED, 'logged_by' => $owner->id,
        ]);

        $response = $this->actingAs($owner, 'sanctum')->patchJson(
            "/api/hotels/{$hotel->id}/expenses/{$expense->id}/review",
            ['decision' => 'rejected']
        );

        $response->assertStatus(422);
    }

    public function test_expenses_can_be_filtered_by_status(): void
    {
        ['hotel' => $hotel, 'owner' => $owner] = $this->makeHotelWithBeds();
        Expense::create(['hotel_id' => $hotel->id, 'category' => 'utility', 'amount' => 1000, 'date' => '2026-09-01', 'status' => 'pending', 'logged_by' => $owner->id]);
        Expense::create(['hotel_id' => $hotel->id, 'category' => 'utility', 'amount' => 2000, 'date' => '2026-09-02', 'status' => 'approved', 'logged_by' => $owner->id]);

        $response = $this->actingAs($owner, 'sanctum')->getJson("/api/hotels/{$hotel->id}/expenses?status=approved");

        $response->assertStatus(200)->assertJsonCount(1)->assertJsonPath('0.amount', '2000.00');
    }

    public function test_analytics_summary_reflects_revenue_expenses_and_net_savings(): void
    {
        ['hotel' => $hotel, 'owner' => $owner] = $this->makeHotelWithBeds();
        Expense::create([
            'hotel_id' => $hotel->id, 'category' => 'utility', 'amount' => 3000,
            'date' => now()->toDateString(), 'status' => 'approved', 'logged_by' => $owner->id, 'approved_by' => $owner->id,
        ]);

        $response = $this->actingAs($owner, 'sanctum')->getJson('/api/analytics/summary');

        $response->assertStatus(200)
            ->assertJsonPath('expenses_total', 3000)
            ->assertJsonPath('net_savings', -3000);
    }

    public function test_super_admin_and_warden_cannot_hit_analytics_the_same_way_as_owner(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->getJson('/api/analytics/summary');

        $response->assertStatus(403);
    }
}
