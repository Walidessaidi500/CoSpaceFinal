<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Espacio
 *
 * Representa un espacio de coworking publicado en la plataforma CoSpace.
 * Cada espacio pertenece a un anfitrión y tiene información como título,
 * ubicación (ciudad, dirección, coordenadas), descripción, precio por hora,
 * capacidad máxima, valoración promedio y estado (Disponible, En Mantenimiento, etc.).
 * Se relaciona con servicios mediante una tabla pivote, tiene fotos asociadas,
 * reservas y valoraciones de los clientes.
 * Al eliminar un espacio, se eliminan también sus reservas en cascada.
 */
class Espacio extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'espacios';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_espacio';

    // Campos permitidos para asignación masiva mediante create() o fill()
    protected $fillable = [
        'id_anfitrion',
        'titulo',
        'ciudad',
        'direccion',
        'descripcion',
        'precio_hora',
        'capacidad',
        'rating_promedio',
        'total_resenas',
        'estado',
        'latitud',
        'longitud'
    ];

    /**
     * Relación: un espacio pertenece a un anfitrión.
     * Permite acceder al perfil del anfitrión que publicó este espacio.
     */
    public function anfitrion()
    {
        return $this->belongsTo(Anfitrion::class, 'id_anfitrion', 'id_usuario');
    }

    /**
     * Relación muchos a muchos: un espacio puede ofrecer múltiples servicios.
     * La relación se gestiona a través de la tabla pivote 'espacio_servicios'
     * que vincula espacios con servicios (WiFi, proyector, café, etc.).
     */
    public function servicios()
    {
        return $this->belongsToMany(
            Servicio::class,
            'espacio_servicios',
            'id_espacio',
            'id_servicio'
        );
    }

    /**
     * Relación: un espacio tiene muchas fotos asociadas.
     * Permite obtener todas las imágenes del espacio, incluyendo la principal.
     */
    public function fotos()
    {
        return $this->hasMany(FotoEspacio::class, 'id_espacio');
    }

    /**
     * Relación: un espacio tiene muchas reservas realizadas por los clientes.
     */
    public function reservas()
    {
        return $this->hasMany(Reserva::class, 'id_espacio');
    }

    /**
     * Relación: un espacio tiene muchas valoraciones escritas por los clientes.
     */
    public function valoraciones()
    {
        return $this->hasMany(Valoracion::class, 'id_espacio', 'id_espacio');
    }

    /**
     * Evento de eliminación en cascada a nivel de Eloquent.
     *
     * Cuando se elimina un espacio, se eliminan primero todas sus reservas asociadas
     * una por una (en lugar de masivamente) para que cada reserva dispare su propio
     * evento 'deleting' y así se eliminen también sus dependencias (pagos, valoraciones, ajustes).
     * Esto evita errores de restricción de clave foránea (error 1451).
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($espacio) {
            // Se eliminan las reservas individualmente para respetar la cascada de eliminación de cada reserva
            $espacio->reservas->each(function ($reserva) {
                $reserva->delete();
            });
        });
    }
}
