<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Booking extends Model
{
    use HasFactory;

    public const STATUS_PENDING = 'pending';

    public const STATUS_APPROVED = 'approved';

    public const STATUS_REJECTED = 'rejected';

    public const STATUS_ACTIVE = 'active';

    public const STATUS_CHECKED_OUT = 'checked_out';

    public const STATUS_CANCELLED = 'cancelled';

    public const CREATED_BY_SELF = 'self';

    public const CREATED_BY_FRONT_DESK = 'front_desk';

    public const CREATED_BY_WARDEN = 'warden';

    public const CREATED_BY_OWNER = 'owner';

    protected $fillable = [
        'hotel_id',
        'user_id',
        'room_type_id',
        'room_id',
        'bed_id',
        'status',
        'created_by',
        'verification_method',
        'check_in_date',
        'check_out_date',
        'is_recurring',
        'approved_by',
        'approved_at',
        'rejected_by',
        'rejected_at',
        'rejection_reason',
        'checked_out_by',
        'checked_out_at',
    ];

    protected function casts(): array
    {
        return [
            'check_in_date' => 'date',
            'check_out_date' => 'date',
            'is_recurring' => 'boolean',
            'approved_at' => 'datetime',
            'rejected_at' => 'datetime',
            'checked_out_at' => 'datetime',
        ];
    }

    public function hotel(): BelongsTo
    {
        return $this->belongsTo(Hotel::class);
    }

    public function guest(): BelongsTo
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    public function roomType(): BelongsTo
    {
        return $this->belongsTo(RoomType::class);
    }

    public function room(): BelongsTo
    {
        return $this->belongsTo(Room::class);
    }

    public function bed(): BelongsTo
    {
        return $this->belongsTo(Bed::class);
    }

    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    public function rejectedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'rejected_by');
    }

    public function checkedOutBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'checked_out_by');
    }

    public function cycles(): HasMany
    {
        return $this->hasMany(BookingCycle::class);
    }

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function feedback(): HasMany
    {
        return $this->hasMany(Feedback::class);
    }

    public function presenceLogs(): HasMany
    {
        return $this->hasMany(PresenceLog::class);
    }
}
