<?php

use App\Http\Controllers\Api\AnalyticsController;
use App\Http\Controllers\Api\AttendanceController;
use App\Http\Controllers\Api\AuditLogController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\AvailabilityController;
use App\Http\Controllers\Api\BookingController;
use App\Http\Controllers\Api\DocumentController;
use App\Http\Controllers\Api\ExpenseController;
use App\Http\Controllers\Api\FeedbackController;
use App\Http\Controllers\Api\HotelAccountController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\MenuItemController;
use App\Http\Controllers\Api\OrderController;
use App\Http\Controllers\Api\OtpController;
use App\Http\Controllers\Api\PaymentController;
use App\Http\Controllers\Api\PayrollController;
use App\Http\Controllers\Api\PresenceLogController;
use App\Http\Controllers\Api\StaffController;
use App\Http\Controllers\Api\VisitorPassController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

// Public, read-only room/seat availability - visible even before registration/verification.
Route::get('/hotels/{hotel}/availability', [AvailabilityController::class, 'show']);

Route::middleware('auth:sanctum')->group(function () {
    Route::post('/auth/logout', [AuthController::class, 'logout']);
    Route::get('/auth/me', [AuthController::class, 'me']);

    Route::post('/otp/send', [OtpController::class, 'send']);
    Route::post('/otp/verify', [OtpController::class, 'verify']);

    Route::get('/hotels', [HotelController::class, 'index']);
    Route::get('/hotels/{hotel}', [HotelController::class, 'show']);
    Route::post('/hotels', [HotelController::class, 'store'])
        ->middleware('role:'.User::ROLE_SUPER_ADMIN);

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER)->group(function () {
        Route::get('/hotels/{hotel}/accounts', [HotelAccountController::class, 'index']);
        Route::post('/hotels/{hotel}/accounts', [HotelAccountController::class, 'store']);
        Route::delete('/hotels/{hotel}/accounts/{user}', [HotelAccountController::class, 'destroy']);
    });

    Route::post('/documents', [DocumentController::class, 'store']);
    Route::get('/documents', [DocumentController::class, 'index']);
    Route::get('/documents/{document}', [DocumentController::class, 'show']);

    Route::get('/bookings', [BookingController::class, 'index']);
    Route::get('/bookings/{booking}', [BookingController::class, 'show']);
    Route::post('/bookings', [BookingController::class, 'store']);
    Route::post('/bookings/walk-in', [BookingController::class, 'storeWalkIn'])
        ->middleware('role:'.User::ROLE_FRONT_DESK.','.User::ROLE_WARDEN.','.User::ROLE_OWNER.','.User::ROLE_SUPER_ADMIN);

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER.','.User::ROLE_WARDEN)->group(function () {
        Route::patch('/bookings/{booking}/approve', [BookingController::class, 'approve']);
        Route::patch('/bookings/{booking}/reject', [BookingController::class, 'reject']);
        Route::patch('/bookings/{booking}/reassign-bed', [BookingController::class, 'reassignBed']);
        Route::patch('/bookings/{booking}/checkout', [BookingController::class, 'checkout']);
        Route::post('/bookings/{booking}/cycles/renew', [BookingController::class, 'renewCycle']);

        Route::patch('/payments/{payment}/verify', [PaymentController::class, 'verify']);
    });

    Route::post('/vouchers/{voucher}/payments', [PaymentController::class, 'store']);

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER.','.User::ROLE_WARDEN)->group(function () {
        Route::get('/hotels/{hotel}/staff', [StaffController::class, 'index']);
        Route::post('/hotels/{hotel}/staff', [StaffController::class, 'store']);
        Route::patch('/hotels/{hotel}/staff/{staff}', [StaffController::class, 'update']);
        Route::delete('/hotels/{hotel}/staff/{staff}', [StaffController::class, 'destroy']);

        Route::get('/staff/{staff}/attendance', [AttendanceController::class, 'index']);
        Route::post('/staff/{staff}/attendance', [AttendanceController::class, 'store']);

        Route::get('/staff/{staff}/payroll', [PayrollController::class, 'index']);
        Route::post('/staff/{staff}/payroll', [PayrollController::class, 'store']);
        Route::patch('/payroll/{payroll}/pay', [PayrollController::class, 'pay']);

        Route::get('/hotels/{hotel}/expenses', [ExpenseController::class, 'index']);
        Route::post('/hotels/{hotel}/expenses', [ExpenseController::class, 'store']);
    });

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER)->group(function () {
        Route::patch('/hotels/{hotel}/expenses/{expense}/review', [ExpenseController::class, 'review']);
        Route::get('/analytics/summary', [AnalyticsController::class, 'summary']);
    });

    Route::get('/hotels/{hotel}/menu', [MenuItemController::class, 'index']);
    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER.','.User::ROLE_WARDEN)->group(function () {
        Route::post('/hotels/{hotel}/menu', [MenuItemController::class, 'store']);
        Route::patch('/hotels/{hotel}/menu/{menuItem}', [MenuItemController::class, 'update']);
        Route::delete('/hotels/{hotel}/menu/{menuItem}', [MenuItemController::class, 'destroy']);

        Route::patch('/orders/{order}/status', [OrderController::class, 'updateStatus']);
    });

    Route::get('/bookings/{booking}/orders', [OrderController::class, 'index']);
    Route::post('/orders', [OrderController::class, 'store']);

    Route::post('/bookings/{booking}/feedback', [FeedbackController::class, 'store']);
    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER.','.User::ROLE_WARDEN)->group(function () {
        Route::get('/hotels/{hotel}/feedback', [FeedbackController::class, 'index']);
    });

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER.','.User::ROLE_WARDEN.','.User::ROLE_FRONT_DESK)->group(function () {
        Route::get('/bookings/{booking}/presence', [PresenceLogController::class, 'index']);
        Route::post('/bookings/{booking}/presence', [PresenceLogController::class, 'store']);

        Route::get('/hotels/{hotel}/visitor-passes', [VisitorPassController::class, 'index']);
        Route::post('/hotels/{hotel}/visitor-passes', [VisitorPassController::class, 'store']);
        Route::patch('/hotels/{hotel}/visitor-passes/{visitorPass}/checkout', [VisitorPassController::class, 'checkout']);
    });

    Route::middleware('role:'.User::ROLE_SUPER_ADMIN.','.User::ROLE_OWNER)->group(function () {
        Route::get('/audit-logs', [AuditLogController::class, 'index']);
    });
});
