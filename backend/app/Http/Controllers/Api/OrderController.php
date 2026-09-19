<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Food\CreateOrderRequest;
use App\Models\Booking;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;

class OrderController extends Controller
{
    public function index(Request $request, Booking $booking): JsonResponse
    {
        $this->authorizeView($request->user(), $booking);

        return response()->json($booking->orders()->with('items.menuItem')->latest()->get());
    }

    public function store(CreateOrderRequest $request): JsonResponse
    {
        $booking = Booking::findOrFail($request->integer('booking_id'));

        abort_unless($request->user()->id === $booking->user_id, 403);
        abort_unless($booking->status === Booking::STATUS_ACTIVE, 422, 'Food can only be ordered during an active stay.');

        $order = DB::transaction(function () use ($request, $booking) {
            $total = 0;
            $lines = [];

            foreach ($request->input('items') as $line) {
                $menuItem = MenuItem::where('id', $line['menu_item_id'])
                    ->where('hotel_id', $booking->hotel_id)
                    ->where('is_available', true)
                    ->firstOrFail();

                $lineTotal = $menuItem->price * $line['quantity'];
                $total += $lineTotal;

                $lines[] = [
                    'menu_item_id' => $menuItem->id,
                    'quantity' => $line['quantity'],
                    'unit_price' => $menuItem->price,
                ];
            }

            $order = $booking->orders()->create([
                'status' => Order::STATUS_PENDING,
                'payment_status' => $request->boolean('pay_now') ? Order::PAYMENT_PAID : Order::PAYMENT_UNPAID,
                'total' => $total,
            ]);

            $order->items()->createMany($lines);

            return $order;
        });

        return response()->json($order->load('items.menuItem'), 201);
    }

    public function updateStatus(Request $request, Order $order): JsonResponse
    {
        $this->authorizeManage($request->user(), $order->booking);

        $data = $request->validate([
            'status' => ['required', Rule::in([Order::STATUS_PENDING, Order::STATUS_PREPARING, Order::STATUS_DELIVERED])],
        ]);

        $order->update($data);

        return response()->json($order->fresh());
    }

    private function authorizeView(User $actor, Booking $booking): void
    {
        abort_unless(
            $actor->id === $booking->user_id
                || $actor->isSuperAdmin()
                || ($actor->isOwner() && $booking->hotel->owner_id === $actor->id)
                || $actor->hotel_id === $booking->hotel_id,
            403
        );
    }

    private function authorizeManage(User $actor, Booking $booking): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $booking->hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $booking->hotel_id),
            403
        );
    }
}
