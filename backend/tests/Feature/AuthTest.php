<?php

namespace Tests\Feature;

use App\Models\Otp;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase;

    public function test_a_guest_can_register_and_receives_a_token(): void
    {
        Notification::fake();

        $response = $this->postJson('/api/auth/register', [
            'name' => 'Guest Sam',
            'email' => 'sam@example.com',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('user.role', User::ROLE_STUDENT)
            ->assertJsonPath('user.email_verified_at', null)
            ->assertJsonStructure(['token']);

        $this->assertDatabaseHas('users', ['email' => 'sam@example.com', 'role' => User::ROLE_STUDENT]);
        $this->assertDatabaseCount('otps', 1);
    }

    public function test_registration_requires_matching_password_confirmation(): void
    {
        $response = $this->postJson('/api/auth/register', [
            'name' => 'Guest Sam',
            'email' => 'sam@example.com',
            'password' => 'password123',
            'password_confirmation' => 'nope',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('password');
    }

    public function test_a_user_can_log_in_with_correct_credentials(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(200)->assertJsonPath('user.id', $user->id);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(422);
    }

    public function test_login_fails_for_a_deactivated_account(): void
    {
        $user = User::factory()->create(['password' => bcrypt('secret123'), 'is_active' => false]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(422);
    }

    public function test_an_unverified_user_can_still_log_in(): void
    {
        $user = User::factory()->unverified()->create(['password' => bcrypt('secret123')]);

        $response = $this->postJson('/api/auth/login', [
            'email' => $user->email,
            'password' => 'secret123',
        ]);

        $response->assertStatus(200);
    }

    public function test_a_user_can_verify_their_email_with_a_valid_otp(): void
    {
        $user = User::factory()->unverified()->create();
        $otp = Otp::create([
            'user_id' => $user->id,
            'code' => '123456',
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/otp/verify', ['code' => '123456']);

        $response->assertStatus(200);
        $this->assertNotNull($user->fresh()->email_verified_at);
        $this->assertNotNull($otp->fresh()->consumed_at);
    }

    public function test_verification_fails_with_an_expired_otp(): void
    {
        $user = User::factory()->unverified()->create();
        Otp::create([
            'user_id' => $user->id,
            'code' => '123456',
            'expires_at' => now()->subMinute(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/otp/verify', ['code' => '123456']);

        $response->assertStatus(422);
        $this->assertNull($user->fresh()->email_verified_at);
    }

    public function test_verification_fails_with_wrong_code(): void
    {
        $user = User::factory()->unverified()->create();
        Otp::create([
            'user_id' => $user->id,
            'code' => '123456',
            'expires_at' => now()->addMinutes(10),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/otp/verify', ['code' => '000000']);

        $response->assertStatus(422);
    }

    public function test_an_already_consumed_otp_cannot_be_reused(): void
    {
        $user = User::factory()->unverified()->create();
        Otp::create([
            'user_id' => $user->id,
            'code' => '123456',
            'expires_at' => now()->addMinutes(10),
            'consumed_at' => now(),
        ]);

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/otp/verify', ['code' => '123456']);

        $response->assertStatus(422);
    }

    public function test_otp_send_is_a_no_op_for_an_already_verified_user(): void
    {
        Notification::fake();
        $user = User::factory()->create(); // verified by default

        $response = $this->actingAs($user, 'sanctum')->postJson('/api/otp/send');

        $response->assertStatus(200);
        $this->assertDatabaseCount('otps', 0);
    }

    public function test_unauthenticated_requests_are_rejected(): void
    {
        $this->getJson('/api/auth/me')->assertStatus(401);
    }
}
