<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Expense\CreateExpenseRequest;
use App\Models\Expense;
use App\Models\Hotel;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ExpenseController extends Controller
{
    public function index(Request $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeView($request->user(), $hotel);

        $query = $hotel->expenses()->with(['loggedBy', 'approvedBy']);

        if ($request->filled('status')) {
            $query->where('status', $request->input('status'));
        }

        if ($request->filled('category')) {
            $query->where('category', $request->input('category'));
        }

        if ($request->filled('vendor')) {
            $query->where('vendor', 'like', '%'.$request->input('vendor').'%');
        }

        if ($request->filled('from')) {
            $query->whereDate('date', '>=', $request->input('from'));
        }

        if ($request->filled('to')) {
            $query->whereDate('date', '<=', $request->input('to'));
        }

        return response()->json($query->latest('date')->get());
    }

    public function store(CreateExpenseRequest $request, Hotel $hotel): JsonResponse
    {
        $this->authorizeLog($request->user(), $hotel);

        $disk = config('filesystems.default');
        $receiptPath = $request->hasFile('receipt')
            ? $request->file('receipt')->store('expense-receipts/'.$hotel->id, $disk)
            : null;

        $expense = $hotel->expenses()->create([
            'category' => $request->input('category'),
            'vendor' => $request->input('vendor'),
            'amount' => $request->input('amount'),
            'date' => $request->input('date'),
            'receipt_path' => $receiptPath,
            'status' => Expense::STATUS_PENDING,
            'logged_by' => $request->user()->id,
        ]);

        return response()->json($expense, 201);
    }

    public function review(Request $request, Hotel $hotel, Expense $expense): JsonResponse
    {
        $this->authorizeReview($request->user(), $hotel);
        abort_unless($expense->hotel_id === $hotel->id, 404);
        abort_unless($expense->status === Expense::STATUS_PENDING, 422, 'This expense has already been reviewed.');

        $data = $request->validate([
            'decision' => ['required', 'in:approved,rejected'],
            'reason' => ['nullable', 'string'],
        ]);

        $expense->update([
            'status' => $data['decision'] === 'approved' ? Expense::STATUS_APPROVED : Expense::STATUS_REJECTED,
            'approved_by' => $request->user()->id,
            'approved_at' => now(),
            'rejection_reason' => $data['decision'] === 'rejected' ? ($data['reason'] ?? null) : null,
        ]);

        return response()->json($expense->fresh());
    }

    private function authorizeView(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $hotel->id),
            403
        );
    }

    private function authorizeLog(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin()
                || ($actor->isOwner() && $hotel->owner_id === $actor->id)
                || ($actor->isWarden() && $actor->hotel_id === $hotel->id),
            403
        );
    }

    private function authorizeReview(User $actor, Hotel $hotel): void
    {
        abort_unless(
            $actor->isSuperAdmin() || ($actor->isOwner() && $hotel->owner_id === $actor->id),
            403,
            'Only the Owner can approve or reject expenses.'
        );
    }
}
