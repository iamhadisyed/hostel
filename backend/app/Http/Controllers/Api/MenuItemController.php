<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\CreateMenuItemRequest;
use App\Models\Hotel;
use App\Models\MenuItem;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeHotelMember($request->user(), $hotel);

        return response()->json($hotel->menuItems()->orderBy('name')->get());
    }

    public function store(CreateMenuItemRequest $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);

        $menuItem = $hotel->menuItems()->create($request->validated());

        return response()->json($menuItem, 201);
    }

    public function update(CreateMenuItemRequest $request, Hotel $hotel, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);
        abort_unless($menuItem->hotel_id === $hotel->id, 404);

        $menuItem->update($request->validated());

        return response()->json($menuItem->fresh());
    }

    public function destroy(Request $request, Hotel $hotel, MenuItem $menuItem): JsonResponse
    {
        $this->authorizeManage($request->user(), $hotel);
        abort_unless($menuItem->hotel_id === $hotel->id, 404);

        $menuItem->update(['is_available' => false]);

        return response()->json(['message' => 'Menu item marked unavailable.']);
    }

    private function authorizeHotelMember(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || $actor->hotel_id === $hotel->id
                || ($actor->isStudent() && $actor->bookings()->where('hotel_id', $hotel->id)->exists()),
            403
        );
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
