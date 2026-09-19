<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Document;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;
use Illuminate\Validation\Rule;

class DocumentController extends Controller
{
    public function store(Request $request): JsonResponse
    {
        $request->validate([
            'type' => ['required', Rule::in([
                Document::TYPE_CNIC_FRONT,
                Document::TYPE_CNIC_BACK,
                Document::TYPE_B_FORM,
                Document::TYPE_FACE_PHOTO,
            ])],
            'file' => ['required', 'file', 'max:10240', 'mimes:jpg,jpeg,png,pdf'],
        ]);

        $disk = config('filesystems.default');
        $path = $request->file('file')->store('documents/'.$request->user()->id, $disk);

        $document = $request->user()->documents()->create([
            'type' => $request->input('type'),
            'path' => $path,
            'disk' => $disk,
        ]);

        return response()->json($document, 201);
    }

    public function index(Request $request): JsonResponse
    {
        return response()->json($request->user()->documents);
    }

    public function show(Request $request, Document $document): JsonResponse
    {
        $actor = $request->user();

        abort_unless(
            $actor->id === $document->user_id || in_array($actor->role, ['warden', 'owner', 'super_admin'], true),
            403
        );

        $disk = Storage::disk($document->disk);

        $url = method_exists($disk, 'temporaryUrl') && $document->disk === 's3'
            ? $disk->temporaryUrl($document->path, now()->addMinutes(10))
            : $disk->url($document->path);

        return response()->json([
            'document' => $document,
            'url' => $url,
        ]);
    }
}
