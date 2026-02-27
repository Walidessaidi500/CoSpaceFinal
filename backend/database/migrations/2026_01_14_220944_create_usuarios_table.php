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
        Schema::create('usuarios', function (Blueprint $table) {
            $table->id('id_usuario');
            $table->string('nombre_completo', 100);
            $table->string('email', 150)->unique();
            $table->string('password');
            $table->string('foto_perfil')->nullable();
            $table->enum('tipo_usuario', ['Cliente', 'Anfitrion', 'Admin']);
            $table->enum('estado_cuenta', ['Activo', 'Suspendido', 'Pendiente'])->default('Pendiente');
            $table->timestamps(); // Crea created_at (fecha_registro) y updated_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('usuarios');
    }
};
