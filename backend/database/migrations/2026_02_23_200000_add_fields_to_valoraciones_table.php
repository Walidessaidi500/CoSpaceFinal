<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('valoraciones', function (Blueprint $table) {
            $table->foreignId('id_espacio')->after('id_reserva')->constrained('espacios', 'id_espacio');
            $table->foreignId('id_usuario')->after('id_espacio')->constrained('usuarios', 'id_usuario');
        });
    }

    public function down(): void
    {
        Schema::table('valoraciones', function (Blueprint $table) {
            $table->dropForeign(['id_espacio']);
            $table->dropForeign(['id_usuario']);
            $table->dropColumn(['id_espacio', 'id_usuario']);
        });
    }
};
