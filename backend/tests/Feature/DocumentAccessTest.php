<?php

namespace Tests\Feature;

use App\Models\Document;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Storage;
use Tests\Feature\Concerns\CreatesHostelFixtures;
use Tests\TestCase;

class DocumentAccessTest extends TestCase
{
    use RefreshDatabase, CreatesHostelFixtures;

    protected function setUp(): void
    {
        parent::setUp();

        Storage::fake('local');
    }

    private function uploadDocumentAs($guest): Document
    {
        $response = $this->actingAs($guest, 'sanctum')->postJson('/api/documents', [
            'type' => Document::TYPE_CNIC_FRONT,
            'file' => $this->fakeUploadedFile('cnic.jpg'),
        ]);

        $response->assertStatus(201);

        return Document::findOrFail($response->json('id'));
    }

    public function test_guest_can_view_their_own_document(): void
    {
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($guest, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(200);
    }

    public function test_warden_can_view_a_document_of_a_guest_booked_at_their_hotel(): void
    {
        ['hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotel->id,
            'room_type_id' => $roomType->id,
            'bed_id' => $beds[0]->id,
        ])->assertStatus(201);

        $this->actingAs($warden, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(200);
    }

    public function test_warden_cannot_view_a_document_of_a_guest_booked_at_a_different_hotel(): void
    {
        ['hotel' => $hotelA, 'roomType' => $roomTypeA, 'beds' => $bedsA] = $this->makeHotelWithBeds();
        ['hotel' => $hotelB] = $this->makeHotelWithBeds();
        $wardenB = $this->makeWarden($hotelB);

        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotelA->id,
            'room_type_id' => $roomTypeA->id,
            'bed_id' => $bedsA[0]->id,
        ])->assertStatus(201);

        $this->actingAs($wardenB, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(403);
    }

    public function test_warden_cannot_view_a_document_of_a_guest_with_no_booking_anywhere(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $warden = $this->makeWarden($hotel);
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($warden, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(403);
    }

    public function test_owner_can_view_a_document_of_a_guest_booked_at_their_hotel(): void
    {
        ['owner' => $owner, 'hotel' => $hotel, 'roomType' => $roomType, 'beds' => $beds] = $this->makeHotelWithBeds();
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotel->id,
            'room_type_id' => $roomType->id,
            'bed_id' => $beds[0]->id,
        ])->assertStatus(201);

        $this->actingAs($owner, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(200);
    }

    public function test_owner_cannot_view_a_document_of_a_guest_booked_at_another_owners_hotel(): void
    {
        ['hotel' => $hotelA, 'roomType' => $roomTypeA, 'beds' => $bedsA] = $this->makeHotelWithBeds();
        $otherOwner = $this->makeOwner();

        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($guest, 'sanctum')->postJson('/api/bookings', [
            'hotel_id' => $hotelA->id,
            'room_type_id' => $roomTypeA->id,
            'bed_id' => $bedsA[0]->id,
        ])->assertStatus(201);

        $this->actingAs($otherOwner, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(403);
    }

    public function test_super_admin_can_view_any_document(): void
    {
        $admin = $this->makeSuperAdmin();
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($admin, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(200);
    }

    public function test_front_desk_cannot_view_guest_documents(): void
    {
        ['hotel' => $hotel] = $this->makeHotelWithBeds();
        $frontDesk = $this->makeFrontDesk($hotel);
        $guest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($frontDesk, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(403);
    }

    public function test_unrelated_student_cannot_view_another_guests_document(): void
    {
        $guest = $this->makeVerifiedStudent();
        $otherGuest = $this->makeVerifiedStudent();
        $document = $this->uploadDocumentAs($guest);

        $this->actingAs($otherGuest, 'sanctum')->getJson("/api/documents/{$document->id}")->assertStatus(403);
    }
}
