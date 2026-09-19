<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\PropertySetup\CreateHotelAccountRequest;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class HotelAccountController extends Controller
{
    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeHotelAccess($request, $hotel);

        return response()->json(
            $hotel->staffUsers()->whereIn('role', [User::ROLE_WARDEN, User::ROLE_FRONT_DESK])->get()
        );
    }

    public function store(CreateHotelAccountRequest $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeHotelAccess($request, $hotel);

        $user = User::create([
            'name' => $request->input('name'),
            'email' => $request->input('email'),
            'password' => $request->input('password'),
            'phone' => $request->input('phone'),
            'role' => $request->input('role'),
            'hotel_id' => $hotel->id,
        ]);

        return response()->json($user, 201);
    }

    public function destroy(Request $request, Hotel $hotel, User $user): JsonResponse
    {
        $this->authorizeHotelAccess($request, $hotel);

        abort_unless($user->hotel_id === $hotel->id, 404);

        $user->update(['is_active' => false]);

        return response()->json(['message' => 'Account deactivated.']);
    }

    private function authorizeHotelAccess(Request $request, Hotel $hotel): void
    {
        $actor = $request->user();

        abort_unless(
            $actor->isSuperAdmin() || ($actor->isOwner() && $hotel->owner_id === $actor->id),
            403
        );
    }
}
