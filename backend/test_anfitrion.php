<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Reserva;
use App\Models\Usuario;

echo "=== Testing indexAnfitrion query for user ID=1 ===\n";

try {
    $userId = 1;
    
    $reservas = Reserva::whereHas('espacio', function ($query) use ($userId) {
        $query->where('id_anfitrion', $userId);
    })->with([
        'espacio' => function ($query) {
            $query->select('id_espacio', 'titulo', 'ciudad', 'direccion');
        },
        'espacio.fotos'
    ])
    ->orderBy('fecha_inicio', 'desc')
    ->get();

    // Cargar datos del cliente manualmente
    foreach ($reservas as $reserva) {
        $cliente = Usuario::where('id_usuario', $reserva->id_cliente)
            ->select('id_usuario', 'nombre_completo', 'email')
            ->first();
        $reserva->cliente_info = $cliente;
    }

    echo "SUCCESS! Found " . $reservas->count() . " reservations\n";
    echo $reservas->toJson(JSON_PRETTY_PRINT) . "\n";
    
} catch (Exception $e) {
    echo "ERROR: " . $e->getMessage() . "\n";
    echo "File: " . $e->getFile() . ":" . $e->getLine() . "\n";
}
