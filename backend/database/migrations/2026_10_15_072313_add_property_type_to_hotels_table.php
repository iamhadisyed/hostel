<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            // What kind of business this is - drives which fields the property
            // setup wizard asks for (distinct from building_type, which is about
            // the physical structure: flat/house/other).
            $table->string('property_type')->default('hostel')->after('name'); // hotel, hostel
        });
    }

    public function down(): void
    {
        Schema::table('hotels', function (Blueprint $table) {
            $table->dropColumn('property_type');
        });
    }
};
