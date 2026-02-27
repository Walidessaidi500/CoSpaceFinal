<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Reporte
 *
 * Representa un reporte creado por un cliente sobre un espacio de coworking
 * en la plataforma CoSpace. Los reportes permiten a los usuarios señalar
 * problemas como fraude, contenido inapropiado, información falsa, etc.
 * Los administradores pueden revisar estos reportes y cambiar su estado
 * (Pendiente, Revisado, Resuelto, Rechazado).
 */
class Reporte extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'reportes';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_reporte';

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_espacio',
        'id_usuario',
        'motivo',
        'descripcion',
        'estado',
    ];

    // Conversión automática de las fechas a objetos Carbon de PHP
    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Relación inversa: un reporte pertenece a un espacio.
     * Permite acceder al espacio que fue reportado.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }

    /**
     * Relación inversa: un reporte fue creado por un usuario (cliente).
     * Permite acceder a los datos del usuario que creó el reporte.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_usuario', 'id_usuario');
    }
}
