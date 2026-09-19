<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\AuditLog;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AuditLogController extends Controller
{
    public function index(Request $request): JsonResponse
    {
        $actor = $request->user();

        $query = AuditLog::query()->with('user')->latest('created_at');

        if ($actor->isOwner()) {
            $query->whereIn('hotel_id', $actor->ownedHotels()->pluck('id'));
        } elseif (! $actor->isSuperAdmin()) {
            abort(403);
        }

        if ($request->filled('hotel_id')) {
            $query->where('hotel_id', $request->integer('hotel_id'));
        }

        if ($request->filled('action')) {
            $query->where('action', 'like', $request->input('action').'%');
        }

        if ($request->filled('from')) {
            $query->where('created_at', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('created_at', '<=', $request->input('to'));
        }

        return response()->json($query->paginate(50));
    }
}
