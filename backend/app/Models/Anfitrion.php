<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Anfitrión
 *
 * Representa el perfil de anfitrión de un usuario en la plataforma CoSpace.
 * Un anfitrión es un usuario que publica espacios de coworking para que
 * otros usuarios (clientes) puedan reservarlos. La clave primaria de esta
 * tabla es la misma que la del usuario padre (id_usuario), creando una
 * relación de herencia 1:1 con la tabla 'usuarios'.
 */
class Anfitrion extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'anfitriones';

    // La clave primaria es el mismo id_usuario de la tabla padre 'usuarios' (relación 1:1)
    protected $primaryKey = 'id_usuario';

    // El ID no es autoincremental ya que viene heredado de la tabla 'usuarios'
    public $incrementing = false;

    // Tipo de dato de la clave primaria
    protected $keyType = 'int';

    // Se desactivan los timestamps porque las fechas se gestionan en la tabla padre 'usuarios'
    public $timestamps = false;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_usuario',
        'biografia',
        'es_verificado',
        'cantidad_espacios'
    ];

    /**
     * Relación inversa: un anfitrión pertenece a (es) un usuario.
     * Permite acceder a los datos del usuario asociado a este perfil de anfitrión.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relación: un anfitrión tiene muchos espacios publicados en la plataforma.
     * Permite obtener todos los espacios de coworking creados por este anfitrión.
     */
    public function espacios()
    {
        return $this->hasMany(Espacio::class, 'id_anfitrion', 'id_usuario');
    }
}
