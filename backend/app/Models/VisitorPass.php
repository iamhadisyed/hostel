<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class VisitorPass extends Model
{
    use HasFactory;

    protected $fillable = [
        'hotel_id',
        'visitor_name',
        'cnic',
        'phone',
        'host_booking_id',
        'purpose',
        'checked_in_at',
        'checked_out_at',
        'logged_by',
    ];

    protected function casts(): array
    {
        return [
            'checked_in_at' => 'datetime',
            'checked_out_at' => 'datetime',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function hostBooking(): BelongsTo
    {
        return $this->belongsTo(Booking::class, 'host_booking_id');
    }

    public function loggedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'logged_by');
    }
}
