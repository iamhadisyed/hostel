<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Payroll;
use App\Models\Staff;
use App\Models\User;
use App\Services\AuditLogService;
use App\Services\PayrollService;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Storage;

class PayrollController extends Controller
{
    public function __construct(
        private readonly PayrollService $payrollService,
        private readonly AuditLogService $auditLog,
    ) {}

    public function index(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $staff);

        return response()->json($staff->payroll()->with('deductions')->latest('period_start')->get());
    }

    public function store(Request $request, Staff $staff): JsonResponse
    {
        $this->authorizeManage($request->user(), $staff);

        $data = $request->validate([
            'period_start' => ['required', 'date'],
            'period_end' => ['required', 'date', 'after_or_equal:period_start'],
            'deductions' => ['nullable', 'array'],
            'deductions.*.type' => ['required_with:deductions', 'in:deduction,advance,loan_repayment'],
            'deductions.*.amount' => ['required_with:deductions', 'numeric', 'min:0'],
            'deductions.*.note' => ['nullable', 'string'],
        ]);

        $payroll = $this->payrollService->generate(
            $staff,
            Carbon::parse($data['period_start']),
            Carbon::parse($data['period_end']),
            $data['deductions'] ?? []
        );

        return response()->json($payroll, 201);
    }

    public function pay(Request $request, Payroll $payroll): JsonResponse
    {
        $this->authorizeManage($request->user(), $payroll->staff);

        abort_unless($payroll->status === Payroll::STATUS_PENDING, 422, 'This payroll entry has already been paid.');

        $payroll->load(['staff.hotel', 'deductions']);

        $pdf = Pdf::loadView('pdf.salary-slip', [
            'payroll' => $payroll,
            'staff' => $payroll->staff,
            'hotel' => $payroll->staff->hotel,
        ]);

        $disk = config('filesystems.default');
        $path = 'salary-slips/'.$payroll->staff_id.'/'.$payroll->id.'.pdf';
        Storage::disk($disk)->put($path, $pdf->output());

        $payroll->update([
            'status' => Payroll::STATUS_PAID,
            'paid_by' => $request->user()->id,
            'paid_at' => now(),
            'slip_path' => $path,
        ]);

        $this->auditLog->log(
            $request->user(),
            $payroll->staff->hotel_id,
            'payroll.paid',
            $payroll,
            ['status' => 'pending'],
            ['status' => 'paid', 'net_amount' => $payroll->net_amount]
        );

        return response()->json($payroll->fresh());
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
