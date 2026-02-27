<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;

/**
 * Proveedor de Servicios de la Aplicación (AppServiceProvider)
 *
 * Este proveedor es el punto central para registrar y arrancar servicios
 * de la aplicación Laravel. Se utiliza para vincular interfaces con implementaciones,
 * registrar macros, configurar servicios de terceros y cualquier inicialización
 * que deba ejecutarse al arrancar la aplicación.
 */
class AppServiceProvider extends ServiceProvider
{
    /**
     * Registra los servicios de la aplicación en el contenedor de inyección de dependencias.
     * Se ejecuta antes de que cualquier otro proveedor haya sido cargado.
     */
    public function register(): void
    {
    }

    /**
     * Arranca los servicios de la aplicación.
     * Se ejecuta después de que todos los proveedores hayan sido registrados.
     * Aquí se configuran servicios, se publican recursos y se ejecuta cualquier
     * lógica de inicialización necesaria.
     */
    public function boot(): void
    {
    }
}
