<?php

use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\HotelAccountController;
use App\Http\Controllers\Api\HotelController;
use App\Http\Controllers\Api\OtpController;
use App\Models\User;
use Illuminate\Support\Facades\Route;

Route::post('/auth/register', [AuthController::class, 'register']);
Route::post('/auth/login', [AuthController::class, 'login']);

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
});
