<?php

namespace Tests\Feature;

use App\Models\Staff;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class StaffPayrollTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    public function test_warden_can_create_staff(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/hotels/{$hotel->id}/staff", [
            'name' => 'Cook Amir',
            'designation' => 'cook',
            'wage_type' => 'daily',
            'rate' => 1000,
        ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('staff', ['name' => 'Cook Amir', 'hotel_id' => $hotel->id]);
    }

    public function test_daily_wage_payroll_is_calculated_from_attendance(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $staff = Staff::create([
            'hotel_id' => $hotel->id, 'name' => 'Cook Amir', 'designation' => 'cook',
            'wage_type' => 'daily', 'rate' => 1000,
        ]);

        foreach (['2026-09-01', '2026-09-02', '2026-09-03'] as $date) {
            $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/attendance", [
                'date' => $date, 'status' => 'present',
            ])->assertStatus(201);
        }
        $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/attendance", [
            'date' => '2026-09-04', 'status' => 'half_day',
        ])->assertStatus(201);
        $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/attendance", [
            'date' => '2026-09-05', 'status' => 'absent',
        ])->assertStatus(201);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/payroll", [
            'period_start' => '2026-09-01',
            'period_end' => '2026-09-05',
        ]);

        // 3 full days + 1 half day = 3.5 * 1000
        $response->assertStatus(201)->assertJsonPath('gross_amount', '3500.00');
    }

    public function test_monthly_wage_payroll_ignores_attendance_and_uses_flat_rate(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $staff = Staff::create([
            'hotel_id' => $hotel->id, 'name' => 'Manager Ali', 'designation' => 'manager',
            'wage_type' => 'monthly', 'rate' => 50000,
        ]);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/payroll", [
            'period_start' => '2026-09-01',
            'period_end' => '2026-09-30',
        ]);

        $response->assertStatus(201)->assertJsonPath('gross_amount', '50000.00');
    }

    public function test_payroll_deductions_and_advances_reduce_net_amount(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $staff = Staff::create([
            'hotel_id' => $hotel->id, 'name' => 'Manager Ali', 'designation' => 'manager',
            'wage_type' => 'monthly', 'rate' => 50000,
        ]);

        $response = $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/payroll", [
            'period_start' => '2026-09-01',
            'period_end' => '2026-09-30',
            'deductions' => [
                ['type' => 'deduction', 'amount' => 1000, 'note' => 'late fine'],
                ['type' => 'advance', 'amount' => 2000, 'note' => 'emergency advance'],
            ],
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('total_deductions', '1000.00')
            ->assertJsonPath('total_advances', '2000.00')
            ->assertJsonPath('net_amount', '47000.00');
    }

    public function test_paying_payroll_generates_a_pdf_slip(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);

        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $staff = Staff::create([
            'hotel_id' => $hotel->id, 'name' => 'Manager Ali', 'designation' => 'manager',
            'wage_type' => 'monthly', 'rate' => 50000,
        ]);

        $generate = $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/payroll", [
            'period_start' => '2026-09-01', 'period_end' => '2026-09-30',
        ]);
        $payrollId = $generate->json('id');

        $response = $this->actingAs($warden, 'sanctum')->patchJson("/api/payroll/{$payrollId}/pay");

        $response->assertStatus(200)->assertJsonPath('status', 'paid');
        $slipPath = $response->json('slip_path');
        $this->assertNotNull($slipPath);
        Storage::disk('local')->assertExists($slipPath);
    }

    public function test_payroll_cannot_be_paid_twice(): void
    {
        Storage::fake('local');
        config(['filesystems.default' => 'local']);

        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $staff = Staff::create([
            'hotel_id' => $hotel->id, 'name' => 'Manager Ali', 'designation' => 'manager',
            'wage_type' => 'monthly', 'rate' => 50000,
        ]);
        $payrollId = $this->actingAs($warden, 'sanctum')->postJson("/api/staff/{$staff->id}/payroll", [
            'period_start' => '2026-09-01', 'period_end' => '2026-09-30',
        ])->json('id');

        $this->actingAs($warden, 'sanctum')->patchJson("/api/payroll/{$payrollId}/pay")->assertStatus(200);
        $second = $this->actingAs($warden, 'sanctum')->patchJson("/api/payroll/{$payrollId}/pay");

        $second->assertStatus(422);
    }

    public function test_warden_from_another_hotel_cannot_manage_staff(): void
    {
        ['hotel' => $hotelA] = $this->makeHotelWithBeds();
        ['hotel' => $hotelB] = $this->makeHotelWithBeds();
        $wardenB = $this->makeWarden($hotelB);
        $staffA = Staff::create([
            'hotel_id' => $hotelA->id, 'name' => 'Cook Amir', 'designation' => 'cook',
            'wage_type' => 'daily', 'rate' => 1000,
        ]);

        $response = $this->actingAs($wardenB, 'sanctum')->postJson("/api/staff/{$staffA->id}/attendance", [
            'date' => '2026-09-01', 'status' => 'present',
        ]);

        $response->assertStatus(403);
    }
}
