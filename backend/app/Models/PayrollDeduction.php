<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PayrollDeduction extends Model
{
    use HasFactory;

    public const TYPE_DEDUCTION = 'deduction';

    public const TYPE_ADVANCE = 'advance';

    public const TYPE_LOAN_REPAYMENT = 'loan_repayment';

    protected $fillable = [
        'payroll_id',
        'type',
        'amount',
        'note',
    ];

    protected function casts(): array
    {
        return [
            'amount' => 'decimal:2',
        ];
    }

    public function payroll(): BelongsTo
    {
        return $this->belongsTo(Payroll::class);
    }
}
