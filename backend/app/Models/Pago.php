<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Pago
 *
 * Representa un pago registrado en la plataforma CoSpace, vinculado a una reserva
 * específica. Almacena el monto pagado, el método de pago utilizado (Tarjeta, PayPal,
 * Transferencia) y el estado del pago (Pendiente, Completado, Fallido, Reembolsado).
 * Cada reserva tiene un único pago asociado (relación 1:1).
 */
class Pago extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'pagos';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_pago';

    // Se activan los timestamps porque la tabla incluye columnas created_at y updated_at
    public $timestamps = true;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_reserva',
        'monto_pagado',
        'metodo_pago',
        'estado_pago',
    ];

    // Conversión automática del monto pagado a tipo decimal con 2 decimales
    protected $casts = [
        'monto_pagado' => 'decimal:2',
    ];

    /**
     * Relación inversa: un pago pertenece a una reserva específica.
     * Permite acceder a la reserva asociada a este pago.
     */
    public function reserva()
    {
        return $this->belongsTo(Reserva::class, 'id_reserva', 'id_reserva');
    }
}