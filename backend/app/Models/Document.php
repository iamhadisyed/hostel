<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Document extends Model
{
    use HasFactory;

    public const TYPE_CNIC_FRONT = 'cnic_front';

    public const TYPE_CNIC_BACK = 'cnic_back';

    public const TYPE_B_FORM = 'b_form';

    public const TYPE_FACE_PHOTO = 'face_photo';

    public const TYPE_PAYMENT_PROOF = 'payment_proof';

    public const TYPE_EXPENSE_RECEIPT = 'expense_receipt';

    protected $fillable = [
        'user_id',
        'type',
        'path',
        'disk',
    ];

    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class);
    }
}
