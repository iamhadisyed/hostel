<?php

namespace App\Notifications;

use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

// Sent synchronously (not ShouldQueue): shared hosting has no queue worker
// process, so a queued notification would just sit in the `jobs` table and
// the OTP email would never actually go out.
class OtpCodeNotification extends Notification
{
    public function __construct(private readonly string $code, private readonly int $expiryMinutes) {}

    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        return (new MailMessage)
            ->subject('Your verification code')
            ->greeting('Hello '.$notifiable->name.',')
            ->line('Your verification code is: '.$this->code)
            ->line("This code expires in {$this->expiryMinutes} minutes.")
            ->line('If you did not request this, you can ignore this email.');
    }
}
