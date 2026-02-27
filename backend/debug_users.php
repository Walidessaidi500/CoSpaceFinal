<?php
require 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

echo "=== All Users ===\n";
$users = App\Models\Usuario::all();
foreach ($users as $u) {
    echo "ID: {$u->id_usuario}, Email: {$u->email}, Tipo: {$u->tipo_usuario}\n";
}
