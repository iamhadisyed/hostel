<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class AttendanceController extends Controller
{
    public function index(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $staff);

        $query = $staff->attendance()->orderByDesc('date');

        if ($request->filled('from')) {
            $query->where('date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->where('date', '<=', $request->input('to'));
        }

        return response()->json($query->get());
    }

    public function store(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $staff);

        $data = $request->validate([
            'date' => ['required', 'date'],
            'status' => ['required', Rule::in([
                Attendance::STATUS_PRESENT,
                Attendance::STATUS_ABSENT,
                Attendance::STATUS_HALF_DAY,
                Attendance::STATUS_LEAVE,
            ])],
        ]);

        $attendance = $staff->attendance()->updateOrCreate(
            ['date' => $data['date']],
            ['status' => $data['status'], 'marked_by' => $request->user()->id]
        );

        return response()->json($attendance, 201);
    }

    private function authorizeManage(User $actor, Staff $staff): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $staff->hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $staff->hotel_id),
            403
        );
    }
}
