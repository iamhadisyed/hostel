<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { font-family: sans-serif; font-size: 13px; color: #222; }
        h1 { font-size: 18px; margin-bottom: 0; }
        .muted { color: #666; }
        table { width: 100%; border-collapse: collapse; margin-top: 16px; }
        td, th { padding: 6px 8px; border-bottom: 1px solid #ddd; text-align: left; }
        .total-row td { font-weight: bold; border-top: 2px solid #333; }
    </style>
</head>
<body>
    <h1>{{ $hotel->name }}</h1>
    <p class="muted">Salary Slip &mdash; {{ $payroll->period_start->format('d M Y') }} to {{ $payroll->period_end->format('d M Y') }}</p>

    <table>
        <tr><td>Staff Name</td><td>{{ $staff->name }}</td></tr>
        <tr><td>Designation</td><td>{{ $staff->designation }}</td></tr>
        <tr><td>Wage Type</td><td>{{ ucfirst($staff->wage_type) }}</td></tr>
        <tr><td>Rate</td><td>{{ number_format($staff->rate, 2) }}</td></tr>
    </table>

    <table>
        <tr><th>Description</th><th>Amount</th></tr>
        <tr><td>Gross Amount</td><td>{{ number_format($payroll->gross_amount, 2) }}</td></tr>
        @foreach ($payroll->deductions as $deduction)
            <tr>
                <td>{{ ucfirst(str_replace('_', ' ', $deduction->type)) }}{{ $deduction->note ? ' - '.$deduction->note : '' }}</td>
                <td>-{{ number_format($deduction->amount, 2) }}</td>
            </tr>
        @endforeach
        <tr class="total-row"><td>Net Amount</td><td>{{ number_format($payroll->net_amount, 2) }}</td></tr>
    </table>

    <p class="muted" style="margin-top: 24px;">Paid on {{ optional($payroll->paid_at)->format('d M Y') }}</p>
</body>
</html>
