<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use App\Models\Usuario;
use App\Models\Cliente;
use App\Models\Anfitrion;

class UsersTestSeeder extends Seeder
{
    public function run(): void
    {
        for ($i = 1; $i <= 3; $i++) {
            $clienteUser = Usuario::firstOrCreate(
                ['email' => "cliente{$i}@test.com"],
                [
                    'nombre_completo' => "Cliente Prueba {$i}",
                    'password'        => Hash::make('password123'),
                    'tipo_usuario'    => 'Cliente',
                    'estado_cuenta'   => 'Activo'
                ]
            );

            Cliente::firstOrCreate(
                ['id_usuario' => $clienteUser->id_usuario],
                [
                    'telefono'         => '555-000' . $i,
                    'metodo_pago_pref' => 'Tarjeta'
                ]
            );
        }

        for ($i = 1; $i <= 3; $i++) {
            $anfitrionUser = Usuario::firstOrCreate(
                ['email' => "anfitrion{$i}@test.com"],
                [
                    'nombre_completo' => "Anfitrion Prueba {$i}",
                    'password'        => Hash::make('password123'),
                    'tipo_usuario'    => 'Anfitrion',
                    'estado_cuenta'   => 'Activo'
                ]
            );

            Anfitrion::firstOrCreate(
                ['id_usuario' => $anfitrionUser->id_usuario],
                [
                    'biografia'     => "Soy el anfitrión de prueba número {$i}",
                    'es_verificado' => true,
                    'cantidad_espacios' => 0
                ]
            );
        }

        for ($i = 1; $i <= 3; $i++) {
            $adminUser = Usuario::firstOrCreate(
                ['email' => "admin{$i}@test.com"],
                [
                    'nombre_completo' => "Admin Prueba {$i}",
                    'password'        => Hash::make('password123'),
                    'tipo_usuario'    => 'Admin', 
                    'estado_cuenta'   => 'Activo'
                ]
            );
            
            \Illuminate\Support\Facades\DB::table('administradores')->updateOrInsert(
                ['id_usuario' => $adminUser->id_usuario],
                [
                    'nivel_acceso' => 'Superadmin',
                    'departamento' => 'IT'
                ]
            );
        }
    }
}
