<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Servicio
 *
 * Representa un servicio o amenidad que puede ofrecer un espacio de coworking
 * (por ejemplo: WiFi, proyector, café, impresora, pizarra, etc.).
 * Los servicios se relacionan con los espacios mediante una tabla pivote
 * 'espacio_servicios' (relación muchos a muchos), permitiendo que un servicio
 * esté disponible en múltiples espacios y que un espacio ofrezca múltiples servicios.
 */
class Servicio extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'servicios';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_servicio';

    // Se desactivan los timestamps porque esta tabla de catálogo no los necesita
    public $timestamps = false;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'nombre_servicio',
        'icono_url'
    ];

    /**
     * Relación inversa muchos a muchos: un servicio puede estar disponible en muchos espacios.
     * La relación se gestiona a través de la tabla pivote 'espacio_servicios'.
     */
    public function espacios()
    {
        return $this->belongsToMany(
            Espacio::class,
            'espacio_servicios',
            'id_servicio',
            'id_espacio'
        );
    }
}