<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Conversación
 *
 * Representa una conversación privada entre dos usuarios de la plataforma CoSpace.
 * Cada conversación vincula exactamente a dos participantes (id_usuario_1 e id_usuario_2)
 * y contiene una colección de mensajes ordenados cronológicamente.
 * Incluye métodos auxiliares para obtener el otro participante de la conversación
 * y contar los mensajes no leídos de un usuario específico.
 */
class Conversacion extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'conversaciones';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_conv';

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_usuario_1',
        'id_usuario_2',
    ];

    /**
     * Relación: primer usuario participante de la conversación.
     * Generalmente corresponde al usuario que inició la conversación.
     */
    public function usuario1()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario_1', 'id_usuario');
    }

    /**
     * Relación: segundo usuario participante de la conversación.
     * Generalmente corresponde al usuario que fue contactado.
     */
    public function usuario2()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario_2', 'id_usuario');
    }

    /**
     * Relación: todos los mensajes de la conversación ordenados cronológicamente.
     * Los mensajes se devuelven en orden ascendente para mostrarlos como un hilo de chat.
     */
    public function mensajes()
    {
        return $this->hasMany(Mensaje::class, 'id_conv', 'id_conv')->orderBy('created_at', 'asc');
    }

    /**
     * Relación: obtiene el último mensaje más reciente de la conversación.
     * Se utiliza para mostrar una vista previa del último mensaje en el listado de conversaciones.
     */
    public function ultimoMensaje()
    {
        return $this->hasOne(Mensaje::class, 'id_conv', 'id_conv')->latest();
    }

    /**
     * Obtiene la instancia del otro usuario participante en la conversación.
     * Dado el ID del usuario actual, devuelve el modelo del otro participante.
     *
     * @param int $miId ID del usuario actual.
     * @return Usuario Modelo del otro participante de la conversación.
     */
    public function getOtroUsuario($miId)
    {
        if ($this->id_usuario_1 == $miId) {
            return $this->usuario2;
        }
        return $this->usuario1;
    }

    /**
     * Cuenta el número de mensajes no leídos para un usuario específico.
     * Solo cuenta los mensajes enviados por el otro participante que aún no han sido marcados como leídos.
     *
     * @param int $userId ID del usuario para el que se cuentan los mensajes no leídos.
     * @return int Número total de mensajes no leídos.
     */
    public function mensajesNoLeidos($userId)
    {
        return $this->mensajes()
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->count();
    }
}
