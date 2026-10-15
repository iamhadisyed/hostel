<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelSubscription extends Model
{
    protected $fillable = [
        'hotel_id',
        'onboarding_fee',
        'onboarding_fee_paid_at',
        'billing_cycle',
        'recurring_amount',
        'billing_anchor_date',
        'notes',
    ];

    protected function casts(): array
    {
        return [
            'onboarding_fee' => 'decimal:2',
            'onboarding_fee_paid_at' => 'datetime',
            'recurring_amount' => 'decimal:2',
            'billing_anchor_date' => 'date',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }
}
