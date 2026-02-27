<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Valoración
 *
 * Representa una reseña o valoración escrita por un cliente sobre un espacio
 * de coworking en la plataforma CoSpace. Cada valoración incluye una puntuación
 * de 1 a 5 estrellas y un comentario opcional. Está vinculada a una reserva
 * específica, al espacio valorado y al usuario que la escribió.
 * Solo se permite una valoración por usuario por espacio.
 */
class Valoracion extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'valoraciones';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_valoracion';

    // Se activan los timestamps para registrar automáticamente cuándo se creó la valoración
    public $timestamps = true;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_reserva',
        'id_espacio',
        'id_usuario',
        'puntuacion',
        'comentario',
    ];

    // Conversión automática de la puntuación a tipo entero
    protected $casts = [
        'puntuacion' => 'integer',
    ];

    /**
     * Relación: la valoración está vinculada a una reserva específica.
     * Permite acceder a la reserva que originó esta reseña.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Relación: la valoración pertenece a un espacio (el objeto calificado).
     * Permite acceder al espacio que fue valorado.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }

    /**
     * Relación: la valoración fue escrita por un usuario (cliente).
     * Se usa el alias 'autor' para mayor claridad semántica en el código.
     */
    public function autor()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}