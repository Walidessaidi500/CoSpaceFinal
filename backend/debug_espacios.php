<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Checking espacios ===\n";
$espacios = App\Models\Espacio::all();
foreach ($espacios as $e) {
    echo "ID: {$e->id_espacio}, Anfitrion: {$e->id_anfitrion}, Titulo: {$e->titulo}\n";
}

echo "\n=== Reservas del anfitrion ID=1 ===\n";
$reservas = App\Models\Reserva::whereHas('espacio', function($q) {
    $q->where('id_anfitrion', 1);
})->get();
echo "Count: " . $reservas->count() . "\n";
foreach ($reservas as $r) {
    echo "Reserva ID: {$r->id_reserva}, Cliente: {$r->id_cliente}, Espacio: {$r->id_espacio}\n";
}
