<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $servicios = [
            ['id_servicio' => 1, 'nombre_servicio' => 'WiFi de Alta Velocidad'],
            ['id_servicio' => 2, 'nombre_servicio' => 'Café y Té Gratis'],
            ['id_servicio' => 3, 'nombre_servicio' => 'Impresora'],
            ['id_servicio' => 4, 'nombre_servicio' => 'Salas de Reuniones'],
            ['id_servicio' => 5, 'nombre_servicio' => 'Estacionamiento'],
            ['id_servicio' => 6, 'nombre_servicio' => 'Aire Acondicionado'],
            ['id_servicio' => 7, 'nombre_servicio' => 'Pizarras'],
            ['id_servicio' => 8, 'nombre_servicio' => 'Cocina'],
        ];

        foreach ($servicios as $servicio) {
            DB::table('servicios')->updateOrInsert(
                ['id_servicio' => $servicio['id_servicio']],
                ['nombre_servicio' => $servicio['nombre_servicio']]
            );
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        DB::table('servicios')->whereIn('id_servicio', [1, 2, 3, 4, 5, 6, 7, 8])->delete();
    }
};
