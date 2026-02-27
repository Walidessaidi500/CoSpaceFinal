<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('reportes', function (Blueprint $table) {
            $table->id('id_reporte');
            $table->foreignId('id_espacio')->constrained('espacios', 'id_espacio')->onDelete('cascade');
            $table->foreignId('id_usuario')->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->enum('motivo', [
                'reserva_fraudulenta',
                'contenido_inapropiado',
                'informacion_falsa',
                'espacio_inseguro',
                'incumplimiento_normas',
                'otro'
            ]);
            $table->text('descripcion')->nullable();
            $table->enum('estado', ['Pendiente', 'Revisado', 'Resuelto', 'Rechazado'])->default('Pendiente');
            $table->timestamps();

            // Un usuario no puede reportar el mismo espacio por el mismo motivo
            $table->unique(['id_espacio', 'id_usuario', 'motivo']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('reportes');
    }
};
