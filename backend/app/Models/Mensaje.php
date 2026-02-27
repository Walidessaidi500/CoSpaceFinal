<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Mensaje
 *
 * Representa un mensaje individual dentro de una conversación entre dos usuarios
 * en el sistema de chat de la plataforma CoSpace. Cada mensaje tiene un emisor,
 * pertenece a una conversación y tiene un estado de lectura (leido).
 */
class Mensaje extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'mensajes';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_mensaje';

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_conv',
        'id_emisor',
        'contenido',
        'leido',
    ];

    // Conversión automática del campo 'leido' a booleano nativo de PHP
    protected $casts = [
        'leido' => 'boolean',
    ];

    /**
     * Relación inversa: un mensaje pertenece a una conversación.
     * Permite acceder a la conversación a la que pertenece este mensaje.
     */
    public function conversacion()
    {
        return $this->belongsTo(Conversacion::class, 'id_conv', 'id_conv');
    }

    /**
     * Relación inversa: un mensaje fue enviado por un usuario (emisor).
     * Permite acceder a los datos del usuario que escribió este mensaje.
     */
    public function emisor()
    {
        return $this->belongsTo(Usuario::class, 'id_emisor', 'id_usuario');
    }
}
