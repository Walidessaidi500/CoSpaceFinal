<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        DB::statement('ALTER TABLE usuarios MODIFY foto_perfil LONGTEXT NULL');
        DB::statement('ALTER TABLE fotos_espacio MODIFY url_foto LONGTEXT NOT NULL');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::statement('ALTER TABLE usuarios MODIFY foto_perfil VARCHAR(255) NULL');
        DB::statement('ALTER TABLE fotos_espacio MODIFY url_foto VARCHAR(255) NOT NULL');
    }
};
