<?php

namespace App\Services;

use App\Models\Otp;
use App\Models\User;
use App\Notifications\OtpCodeNotification;
use Illuminate\Support\Carbon;

class OtpService
{
    public function generateAndSend(User $user): Otp
    {
        $expiryMinutes = (int) config('otp.expiry_minutes', 10);

        $otp = $user->otps()->create([
            'code' => str_pad((string) random_int(0, 999999), 6, '0', STR_PAD_LEFT),
            'expires_at' => Carbon::now()->addMinutes($expiryMinutes),
        ]);

        if ($user->email) {
            $user->notify(new OtpCodeNotification($otp->code, $expiryMinutes));
        }

        return $otp;
    }

    public function verify(User $user, string $code): bool
    {
        $otp = $user->otps()
            ->where('code', $code)
            ->whereNull('consumed_at')
            ->latest()
            ->first();

        if (! $otp || ! $otp->isValid()) {
            return false;
        }

        $otp->update(['consumed_at' => Carbon::now()]);

        if (! $user->hasVerifiedEmail()) {
            $user->markEmailAsVerified();
        }

        return true;
    }
}
