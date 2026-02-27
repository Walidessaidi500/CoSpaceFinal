<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo AjusteReserva
 *
 * Representa un ajuste económico vinculado a una reserva existente.
 * Los ajustes pueden ser cargos extra (por daños, limpieza, etc.),
 * descuentos aplicados o multas por incumplimiento de normas.
 * Cada ajuste incluye el tipo, el monto, el motivo descriptivo
 * y la fecha en la que se realizó.
 */
class AjusteReserva extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos que almacena los ajustes de reservas
    protected $table = 'ajustes_reserva';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_ajuste';

    // Se desactivan los timestamps porque esta tabla solo registra la fecha del ajuste manualmente
    public $timestamps = false;

    // Campos permitidos para asignación masiva mediante create() o fill()
    protected $fillable = [
        'id_reserva',
        'tipo_ajuste',
        'monto',
        'motivo',
        'fecha_ajuste'
    ];

    // Conversión automática de tipos para que Laravel los maneje como objetos nativos
    protected $casts = [
        'monto' => 'decimal:2',
        'fecha_ajuste' => 'datetime',
    ];

    /**
     * Relación: un ajuste pertenece a una reserva específica.
     * Cada ajuste está vinculado a una única reserva mediante la clave foránea 'id_reserva'.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }
}