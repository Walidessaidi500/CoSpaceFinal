<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo FotoEspacio
 *
 * Representa una fotografía asociada a un espacio de coworking en la plataforma CoSpace.
 * Cada espacio puede tener múltiples fotos, y una de ellas se marca como foto principal
 * (es_principal = true) para usarla como imagen destacada en las tarjetas de exploración.
 * Las fotos se almacenan en el disco 'public' y su ruta se guarda en el campo 'url_foto'.
 */
class FotoEspacio extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'fotos_espacio';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_foto';

    // Se desactivan los timestamps porque esta tabla no tiene columnas created_at/updated_at
    public $timestamps = false;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_espacio',
        'url_foto',
        'es_principal'
    ];

    /**
     * Relación inversa: una foto pertenece a un único espacio.
     * Permite acceder al espacio al que pertenece esta fotografía.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }
}