<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Modelo Reserva
 *
 * Representa una reserva de un espacio de coworking realizada por un cliente
 * en la plataforma CoSpace. Cada reserva tiene un rango de fechas (inicio y fin),
 * un monto total calculado según los días y el precio del espacio, y un estado
 * que refleja el ciclo de vida de la reserva: Pendiente, Confirmada, En_Curso,
 * Finalizada o Cancelada. Se relaciona con el cliente, el espacio, un pago,
 * posibles ajustes económicos y una valoración.
 *
 * Al eliminar una reserva, se eliminan en cascada sus dependencias (pago, valoración y ajustes)
 * para evitar errores de clave foránea.
 */
class Reserva extends Model
{
    use HasFactory;

    // Nombre de la tabla en la base de datos
    protected $table = 'reservas';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_reserva';

    // Se activan los timestamps porque la tabla tiene columnas created_at y updated_at
    public $timestamps = true;

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'id_cliente',
        'id_espacio',
        'fecha_inicio',
        'fecha_fin',
        'monto_total',
        'estado'
    ];

    // Conversión automática de tipos: fechas a objetos Carbon y monto a decimal con 2 decimales
    protected $casts = [
        'fecha_inicio' => 'datetime',
        'fecha_fin' => 'datetime',
        'monto_total' => 'decimal:2',
    ];

    /**
     * Relación: una reserva pertenece a un cliente (a través del modelo Cliente).
     * Vincula la reserva con la tabla 'clientes' mediante la clave foránea 'id_cliente'.
     */
    public function cliente()
    {
        return $this->belongsTo(Cliente::class, 'id_cliente', 'id_usuario');
    }

    /**
     * Relación: una reserva pertenece a un espacio específico.
     * Permite acceder a los datos del espacio reservado.
     */
    public function espacio()
    {
        return $this->belongsTo(Espacio::class, 'id_espacio', 'id_espacio');
    }

    /**
     * Relación 1:1: una reserva tiene un único pago asociado.
     * Permite acceder a los datos del pago vinculado a esta reserva.
     */
    public function pago()
    {
        return $this->hasOne(Pago::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Relación: una reserva puede tener múltiples ajustes económicos.
     * Los ajustes pueden ser cargos extra, descuentos o multas aplicadas a la reserva.
     */
    public function ajustes()
    {
        return $this->hasMany(AjusteReserva::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Relación 1:1: una reserva puede tener una valoración (reseña) del cliente.
     * La valoración se escribe después de que la reserva ha finalizado.
     */
    public function valoracion()
    {
        return $this->hasOne(Valoracion::class, 'id_reserva', 'id_reserva');
    }

    /**
     * Relación directa con el modelo Usuario (atajo para acceder al cliente).
     * Permite obtener los datos del usuario sin pasar por el modelo intermedio Cliente.
     * Útil para mostrar nombre, email y foto del cliente en listados de reservas.
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'id_cliente', 'id_usuario');
    }

    /**
     * Evento de eliminación en cascada a nivel de Eloquent.
     *
     * Antes de eliminar una reserva, se eliminan manualmente sus dependencias:
     * el pago asociado, la valoración y todos los ajustes económicos.
     * Esto evita errores de restricción de clave foránea (error 1451) en la base de datos.
     */
    protected static function boot()
    {
        parent::boot();

        static::deleting(function ($reserva) {
            // Se elimina el pago asociado si existe
            if ($reserva->pago) {
                $reserva->pago->delete();
            }
            // Se elimina la valoración asociada si existe
            if ($reserva->valoracion) {
                $reserva->valoracion->delete();
            }
            // Se eliminan todos los ajustes económicos asociados a la reserva
            $reserva->ajustes()->delete();
        });
    }
}