<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class HotelBillingPayment extends Model
{
    public const TYPE_ONBOARDING = 'onboarding';

    public const TYPE_RECURRING = 'recurring';

    protected $fillable = [
        'hotel_id',
        'type',
        'period_start',
        'period_end',
        'amount',
        'paid_at',
        'recorded_by',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'period_start' => 'date',
            'period_end' => 'date',
            'amount' => 'decimal:2',
            'paid_at' => 'date',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    // Named to avoid colliding with the `recorded_by` FK column when this
    // relation is eager-loaded and serialized - Eloquent snake_cases the
    // relation name for the JSON key, and `recordedBy` -> `recorded_by`
    // would silently overwrite the raw column value.
    public function recordedByUser(): BelongsTo
    {
        return $this->belongsTo(User::class, 'recorded_by');
    }
}
