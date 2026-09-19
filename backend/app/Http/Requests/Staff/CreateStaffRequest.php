<?php

namespace App\Http\Requests\Staff;

use App\Models\Staff;
use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateStaffRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'designation' => ['required', 'string', 'max:255'],
            'wage_type' => ['required', Rule::in([Staff::WAGE_DAILY, Staff::WAGE_MONTHLY])],
            'rate' => ['required', 'numeric', 'min:0'],
        ];
    }
}
