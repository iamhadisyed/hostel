<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class UpdateHotelSubscriptionRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'onboarding_fee' => ['required', 'numeric', 'min:0'],
            'billing_cycle' => ['required', Rule::in(['monthly', 'yearly'])],
            'recurring_amount' => ['required', 'numeric', 'min:0'],
            'billing_anchor_date' => ['required', 'date'],
            'notes' => ['nullable', 'string'],
        ];
    }
}
