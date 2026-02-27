<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use App\Models\Espacio;
use App\Models\Usuario;
use App\Models\FotoEspacio;

class EspacioSeeder extends Seeder
{
    public function run()
    {
        // Obtener usuario anfitrión
        $user = Usuario::where('email', 'anfitrion@cospace.com')->first();

        if (!$user) {
            // Respaldo
            $user = Usuario::first();
        }

        if (!$user) {
            $this->command->info('No se encontró usuario para asignar espacios. Ejecuta DatabaseSeeder primero.');
            return;
        }

        // Crear Espacio 1
        $espacio1 = Espacio::firstOrCreate(
            ['titulo' => 'Oficina Moderna en Gran Vía'],
            [
                'id_anfitrion' => $user->id_usuario,
                'ciudad' => 'Madrid',
                'direccion' => 'Calle Gran Vía 123',
                'descripcion' => 'Espacio de coworking moderno con todas las comodidades, ideal para startups y freelancers.',
                'capacidad' => 10,
                'precio_hora' => 25.00,
                'rating_promedio' => 4.8,
                'total_resenas' => 12,
                'estado' => 'Disponible',
                'latitud' => 40.4203,
                'longitud' => -3.7058
            ]
        );

        // Fotos Espacio 1
        if ($espacio1->wasRecentlyCreated) {
            FotoEspacio::create([
                'id_espacio' => $espacio1->id_espacio,
                'url_foto' => 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80', // Oficina moderna
                'es_principal' => true
            ]);
            FotoEspacio::create([
                'id_espacio' => $espacio1->id_espacio,
                'url_foto' => 'https://images.unsplash.com/photo-1524758631624-e2822e304c36?auto=format&fit=crop&w=800&q=80', // Interior
                'es_principal' => false
            ]);
            // Asignar servicios: WiFi(1), Café(2), Impresora(3)
            $espacio1->servicios()->sync([1, 2, 3]);
        }

        // Crear Espacio 2
        $espacio2 = Espacio::firstOrCreate(
            ['titulo' => 'Estudio Creativo en Malasaña'],
            [
                'id_anfitrion' => $user->id_usuario,
                'ciudad' => 'Madrid',
                'direccion' => 'Calle del Pez 10',
                'descripcion' => 'Ambiente relajado e inspirador en el corazón de Malasaña. Perfecto para diseñadores.',
                'capacidad' => 4,
                'precio_hora' => 18.50,
                'rating_promedio' => 4.5,
                'total_resenas' => 5,
                'estado' => 'Disponible',
                'latitud' => 40.4241,
                'longitud' => -3.7065
            ]
        );

        // Fotos Espacio 2
        if ($espacio2->wasRecentlyCreated) {
            FotoEspacio::create([
                'id_espacio' => $espacio2->id_espacio,
                'url_foto' => 'https://images.unsplash.com/photo-1505409859467-3a796fd5798e?auto=format&fit=crop&w=800&q=80', // Estudio
                'es_principal' => true
            ]);
            $espacio2->servicios()->sync([1, 5, 8]); // WiFi(1), Estacionamiento(5), Cocina(8)
        }
    }
}
