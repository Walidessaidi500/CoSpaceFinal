<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== Checking all reservas ===\n";
$all = App\Models\Reserva::all();
echo "Total reservas: " . $all->count() . "\n";

foreach ($all as $r) {
    echo "ID: {$r->id_reserva}, Cliente: {$r->id_cliente}, Espacio: {$r->id_espacio}, Estado: {$r->estado}\n";
}

echo "\n=== Checking reservas for id_cliente=1 ===\n";
$reservas1 = App\Models\Reserva::where('id_cliente', 1)->get();
echo "Count: " . $reservas1->count() . "\n";

echo "\n=== Checking reservas for id_cliente=2 ===\n";
$reservas2 = App\Models\Reserva::where('id_cliente', 2)->get();
echo "Count: " . $reservas2->count() . "\n";
