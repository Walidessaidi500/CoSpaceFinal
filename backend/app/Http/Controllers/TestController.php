<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;

/**
 * Controlador de Pruebas (TestController)
 *
 * Este controlador se utiliza exclusivamente para verificar la conectividad
 * entre el backend de Laravel y la base de datos MySQL. Proporciona un endpoint
 * simple que devuelve el estado de la conexión y el nombre de la base de datos
 * configurada. Es útil durante el desarrollo y la configuración inicial del entorno.
 */
class TestController extends Controller
{
    /**
     * Devuelve información básica de la conexión a la base de datos.
     *
     * @return \Illuminate\Http\JsonResponse Estado de la conexión, nombre de la base de datos y usuario.
     */
    public function index()
    {
        return response()->json([
            'status' => 'Conectado',
            'base_de_datos' => config('database.connections.mysql.database'),
            'usuario' => 'admin'
        ]);
    }
}
