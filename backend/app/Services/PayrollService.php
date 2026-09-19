<?php

namespace App\Services;

use App\Models\Attendance;
use App\Models\Payroll;
use App\Models\Staff;
use Illuminate\Support\Carbon;

class PayrollService
{
    public function calculateGross(Staff $staff, Carbon $periodStart, Carbon $periodEnd): float
    {
        if ($staff->wage_type === Staff::WAGE_MONTHLY) {
            return (float) $staff->rate;
        }

        $attendance = $staff->attendance()
            ->whereDate('date', '>=', $periodStart->toDateString())
            ->whereDate('date', '<=', $periodEnd->toDateString())
            ->get();

        $fullDays = $attendance->where('status', Attendance::STATUS_PRESENT)->count();
        $halfDays = $attendance->where('status', Attendance::STATUS_HALF_DAY)->count();

        return round(($fullDays + ($halfDays * 0.5)) * $staff->rate, 2);
    }

    /**
     * @param  array<int, array{type: string, amount: float, note?: string}>  $deductionLines
     */
    public function generate(Staff $staff, Carbon $periodStart, Carbon $periodEnd, array $deductionLines = []): Payroll
    {
        $gross = $this->calculateGross($staff, $periodStart, $periodEnd);

        $totalDeductions = collect($deductionLines)
            ->whereIn('type', ['deduction', 'loan_repayment'])
            ->sum('amount');

        $totalAdvances = collect($deductionLines)
            ->where('type', 'advance')
            ->sum('amount');

        $payroll = $staff->payroll()->create([
            'period_start' => $periodStart,
            'period_end' => $periodEnd,
            'gross_amount' => $gross,
            'total_deductions' => $totalDeductions,
            'total_advances' => $totalAdvances,
            'net_amount' => $gross - $totalDeductions - $totalAdvances,
            'status' => Payroll::STATUS_PENDING,
        ]);

        foreach ($deductionLines as $line) {
            $payroll->deductions()->create($line);
        }

        return $payroll->load('deductions');
    }
}
