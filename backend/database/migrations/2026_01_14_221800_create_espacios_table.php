<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('espacios', function (Blueprint $table) {
            $table->id('id_espacio');
            $table->foreignId('id_anfitrion')->constrained('anfitriones', 'id_usuario');
            $table->string('titulo', 100);
            $table->string('ciudad', 100);
            $table->string('direccion', 255);
            $table->text('descripcion');
            $table->integer('capacidad');
            $table->decimal('precio_hora', 10, 2);
            $table->decimal('rating_promedio', 3, 2)->default(0);
            $table->integer('total_resenas')->default(0);
            $table->decimal('latitud', 10, 8)->nullable();
            $table->decimal('longitud', 11, 8)->nullable();
            $table->enum('estado', ['Disponible', 'Mantenimiento', 'Inactivo'])->default('Disponible');
            $table->timestamps();
        });

        Schema::create('fotos_espacio', function (Blueprint $table) {
            $table->id('id_foto');
            $table->foreignId('id_espacio')->constrained('espacios', 'id_espacio')->onDelete('cascade');
            $table->string('url_foto'); // Guardamos el VARCHAR de la ruta
            $table->boolean('es_principal')->default(false);
        });

        Schema::create('servicios', function (Blueprint $table) {
            $table->id('id_servicio');
            $table->string('nombre_servicio', 50);
            $table->string('icono_url', 100)->nullable();
        });

        Schema::create('espacio_servicios', function (Blueprint $table) {
            $table->foreignId('id_espacio')->constrained('espacios', 'id_espacio')->onDelete('cascade');
            $table->foreignId('id_servicio')->constrained('servicios', 'id_servicio')->onDelete('cascade');
            $table->primary(['id_espacio', 'id_servicio']);
        });

        Schema::create('reservas', function (Blueprint $table) {
            $table->id('id_reserva');
            $table->foreignId('id_cliente')->constrained('clientes', 'id_usuario');
            $table->foreignId('id_espacio')->constrained('espacios', 'id_espacio');
            $table->dateTime('fecha_inicio');
            $table->dateTime('fecha_fin');
            $table->decimal('monto_total', 10, 2);
            $table->enum('estado', ['Pendiente', 'Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'])->default('Pendiente');
            $table->timestamps();
        });

        Schema::create('ajustes_reserva', function (Blueprint $table) {
            $table->id('id_ajuste');
            $table->foreignId('id_reserva')->constrained('reservas', 'id_reserva')->onDelete('cascade');
            $table->decimal('monto', 10, 2);
            $table->string('motivo');
            $table->timestamps();
        });

        Schema::create('pagos', function (Blueprint $table) {
            $table->id('id_pago');
            $table->foreignId('id_reserva')->unique()->constrained('reservas', 'id_reserva');
            $table->decimal('monto_pagado', 10, 2);
            $table->string('metodo_pago');
            $table->enum('estado_pago', ['Pendiente', 'Completado', 'Fallido', 'Reembolsado'])->default('Pendiente');
            $table->timestamps();
        });

        Schema::create('conversaciones', function (Blueprint $table) {
            $table->id('id_conv');
            $table->foreignId('id_usuario_1')->constrained('usuarios', 'id_usuario');
            $table->foreignId('id_usuario_2')->constrained('usuarios', 'id_usuario');
            $table->timestamps();
        });

        Schema::create('mensajes', function (Blueprint $table) {
            $table->id('id_mensaje');
            $table->foreignId('id_conv')->constrained('conversaciones', 'id_conv')->onDelete('cascade');
            $table->foreignId('id_emisor')->constrained('usuarios', 'id_usuario');
            $table->text('contenido');
            $table->boolean('leido')->default(false);
            $table->timestamps();
        });

        Schema::create('valoraciones', function (Blueprint $table) {
            $table->id('id_valoracion');
            $table->foreignId('id_reserva')->unique()->constrained('reservas', 'id_reserva');
            $table->integer('puntuacion');
            $table->text('comentario')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('valoraciones');
        Schema::dropIfExists('mensajes');
        Schema::dropIfExists('conversaciones');
        Schema::dropIfExists('pagos');
        Schema::dropIfExists('ajustes_reserva');
        Schema::dropIfExists('reservas');
        Schema::dropIfExists('espacio_servicios');
        Schema::dropIfExists('fotos_espacio');

        Schema::dropIfExists('servicios');
        Schema::dropIfExists('espacios');
    }
};
