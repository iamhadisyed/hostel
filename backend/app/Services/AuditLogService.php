<?php

namespace App\Services;

use App\Models\AuditLog;
use App\Models\User;
use Illuminate\Database\Eloquent\Model;

class AuditLogService
{
    public function log(User $actor, ?int $hotelId, string $action, ?Model $auditable = null, array $before = [], array $after = []): AuditLog
    {
        return AuditLog::create([
            'user_id' => $actor->id,
            'role' => $actor->role,
            'hotel_id' => $hotelId,
            'action' => $action,
            'auditable_type' => $auditable ? $auditable::class : null,
            'auditable_id' => $auditable?->getKey(),
            'before' => $before,
            'after' => $after,
            'created_at' => now(),
        ]);
    }
}
