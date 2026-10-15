<?php

namespace App\Http\Requests\Billing;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreHotelBillingPaymentRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'type' => ['required', Rule::in(['onboarding', 'recurring'])],
            'amount' => ['required', 'numeric', 'min:0'],
            'paid_at' => ['required', 'date'],
            'period_start' => ['required_if:type,recurring', 'nullable', 'date'],
            'period_end' => ['nullable', 'date', 'after:period_start'],
            'note' => ['nullable', 'string'],
        ];
    }
}
