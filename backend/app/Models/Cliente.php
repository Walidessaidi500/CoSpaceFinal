<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Cliente
 *
 * Representa el perfil de cliente de un usuario en la plataforma CoSpace.
 * Un cliente es un usuario que puede buscar y reservar espacios de coworking.
 * La clave primaria de esta tabla es la misma que la del usuario padre (id_usuario),
 * creando una relación de herencia 1:1 con la tabla 'usuarios'.
 * Almacena información adicional específica del cliente como teléfono y método de pago preferido.
 */
class Cliente extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'clientes';

    // La clave primaria es el mismo id_usuario de la tabla padre 'usuarios' (relación 1:1)
    protected $primaryKey = 'id_usuario';

    // El ID no es autoincremental ya que viene heredado de la tabla 'usuarios'
    public $incrementing = false;

    // Se desactivan los timestamps porque esta tabla auxiliar no los necesita
    public $timestamps = false;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_usuario',
        'telefono',
        'metodo_pago_pref'
    ];

    /**
     * Relación inversa: un cliente pertenece a (es) un usuario.
     * Permite acceder a los datos del usuario asociado a este perfil de cliente.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }

    /**
     * Relación: un cliente puede realizar muchas reservas de espacios.
     * Permite obtener todas las reservas realizadas por este cliente.
     */
    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'id_cliente', 'id_usuario');
    }
}