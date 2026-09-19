<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\OtpService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class OtpController extends Controller
{
    public function __construct(private readonly OtpService $otpService) {}

    public function send(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.']);
        }

        if (! $user->email) {
            return response()->json(['message' => 'No email on file to send a code to.'], 422);
        }

        $this->otpService->generateAndSend($user);

        return response()->json(['message' => 'Verification code sent.']);
    }

    public function verify(Request $request): JsonResponse
    {
        $request->validate(['code' => ['required', 'string']]);

        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return response()->json(['message' => 'Email is already verified.']);
        }

        if (! $this->otpService->verify($user, $request->string('code'))) {
            return response()->json(['message' => 'Invalid or expired code.'], 422);
        }

        return response()->json(['message' => 'Email verified.', 'user' => $user->fresh()]);
    }
}
