<?php

namespace App\Http\Requests\PropertySetup;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class CreateHotelRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true;
    }

    public function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'building_type' => ['required', Rule::in(['flat', 'house', 'other'])],
            'address' => ['nullable', 'string'],
            'city' => ['nullable', 'string', 'max:255'],
            'floor_count' => ['required', 'integer', 'min:1'],

            // Owner: either attach an existing owner user or create a new one.
            'owner_id' => ['required_without:owner', 'nullable', 'exists:users,id'],
            'owner' => ['required_without:owner_id', 'nullable', 'array'],
            'owner.name' => ['required_with:owner', 'string', 'max:255'],
            'owner.email' => ['required_with:owner', 'email', 'max:255', 'unique:users,email'],
            'owner.password' => ['required_with:owner', 'string', 'min:8'],
            'owner.phone' => ['nullable', 'string', 'max:30'],

            // Floors/rooms setup wizard payload.
            'floors' => ['required', 'array', 'min:1'],
            'floors.*.number' => ['required', 'integer', 'min:1'],
            'floors.*.name' => ['nullable', 'string', 'max:255'],
            'floors.*.rooms' => ['required', 'array', 'min:1'],
            'floors.*.rooms.*.room_number' => ['required', 'string', 'max:255'],
            'floors.*.rooms.*.room_type' => ['required', 'string', 'max:255'],
            'floors.*.rooms.*.capacity' => ['required', 'integer', 'min:1'],

            // Room types with pricing, referenced by name from rooms above.
            'room_types' => ['required', 'array', 'min:1'],
            'room_types.*.name' => ['required', 'string', 'max:255'],
            'room_types.*.default_capacity' => ['required', 'integer', 'min:1'],
            'room_types.*.monthly_price' => ['required', 'numeric', 'min:0'],
            'room_types.*.description' => ['nullable', 'string'],
        ];
    }
}
