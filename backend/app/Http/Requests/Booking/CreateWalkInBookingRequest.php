<?php

namespace App\Http\Requests\Booking;

use Illuminate\Foundation\Http\FormRequest;

class CreateWalkInBookingRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'hotel_id' => ['required', 'exists:hotels,id'],
            'room_type_id' => ['required', 'exists:room_types,id'],
            'bed_id' => ['required', 'exists:beds,id'],
            'check_in_date' => ['nullable', 'date'],

            'guest' => ['required', 'array'],
            'guest.name' => ['required', 'string', 'max:255'],
            'guest.email' => ['nullable', 'email', 'max:255', 'unique:users,email'],
            'guest.phone' => ['nullable', 'string', 'max:30'],
            'guest.cnic' => ['nullable', 'string', 'max:30'],
        ];
    }
}
