<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Staff\CreateStaffRequest;
use App\Models\Hotel;
use App\Models\Staff;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class StaffController extends Controller
{
    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);

        return response()->json($hotel->staff()->with('user')->get());
    }

    public function store(CreateStaffRequest $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);

        $staff = $hotel->staff()->create($request->validated());

        return response()->json($staff, 201);
    }

    public function update(CreateStaffRequest $request, Hotel $hotel, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);
        abort_unless($staff->hotel_id === $hotel->id, 404);

        $staff->update($request->validated());

        return response()->json($staff->fresh());
    }

    public function destroy(Request $request, Hotel $hotel, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);
        abort_unless($staff->hotel_id === $hotel->id, 404);

        $staff->update(['is_active' => false]);

        return response()->json(['message' => 'Staff member deactivated.']);
    }

    private function authorizeManage(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $hotel->id),
            403
        );
    }
}
