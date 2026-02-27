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
        Schema::create('clientes', function (Blueprint $table) {
            $table->foreignId('id_usuario')->primary()->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->string('telefono', 20)->nullable();
            $table->string('metodo_pago_pref', 50)->nullable();
        });

        Schema::create('anfitriones', function (Blueprint $table) {
            $table->foreignId('id_usuario')->primary()->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->text('biografia')->nullable();
            $table->boolean('es_verificado')->default(false);
            $table->integer('cantidad_espacios')->default(0); // Tu atributo solicitado
        });

        Schema::create('administradores', function (Blueprint $table) {
            $table->foreignId('id_usuario')->primary()->constrained('usuarios', 'id_usuario')->onDelete('cascade');
            $table->string('nivel_acceso', 50);
            $table->string('departamento', 50);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('administradores');
        Schema::dropIfExists('anfitriones');
        Schema::dropIfExists('clientes');
    }
};
