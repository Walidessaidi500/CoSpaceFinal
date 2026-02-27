<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->longText('foto_perfil')->nullable()->change();
        });

        Schema::table('fotos_espacio', function (Blueprint $table) {
            $table->longText('url_foto')->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('usuarios', function (Blueprint $table) {
            $table->string('foto_perfil', 255)->nullable()->change();
        });

        Schema::table('fotos_espacio', function (Blueprint $table) {
            $table->string('url_foto', 255)->change();
        });
    }
};
