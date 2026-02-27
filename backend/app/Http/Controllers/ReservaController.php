<?php

namespace App\Http\Controllers;

use App\Models\Reserva;
use App\Models\Espacio;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

/**
 * Controlador de Reservas (ReservaController)
 *
 * Este controlador gestiona todo el flujo de reservas de espacios de coworking en CoSpace.
 * Incluye la verificación de disponibilidad, integración con Stripe para pagos,
 * creación de reservas tras la confirmación del pago, y gestión de reservas tanto
 * para clientes como para anfitriones. También sincroniza automáticamente los estados
 * de las reservas basándose en las fechas actuales (En_Curso, Finalizada).
 */
class ReservaController extends Controller
{
    /**
     * Sincroniza automáticamente los estados de las reservas según la fecha actual.
     *
     * Este método privado se ejecuta antes de devolver listados de reservas para asegurar
     * que los estados reflejen la situación real:
     * - Las reservas 'Confirmada' cuya fecha de inicio ya pasó pero cuya fecha de fin
     *   aún no ha llegado se marcan como 'En_Curso'.
     * - Las reservas 'Confirmada' o 'En_Curso' cuya fecha de fin ya pasó se marcan
     *   como 'Finalizada'.
     */
    private function autoSyncEstados()
    {
        $now = Carbon::now();

        // Se actualizan a 'En_Curso' las reservas confirmadas cuya fecha de inicio ya ha pasado
        // pero cuya fecha de fin aún no ha llegado (están actualmente en uso)
        Reserva::where('estado', 'Confirmada')
            ->where('fecha_inicio', '<=', $now)
            ->where('fecha_fin', '>=', $now)
            ->update(['estado' => 'En_Curso']);

        // Se actualizan a 'Finalizada' las reservas cuya fecha de fin ya ha pasado
        // (tanto las que estaban confirmadas como las que estaban en curso)
        Reserva::whereIn('estado', ['Confirmada', 'En_Curso'])
            ->where('fecha_fin', '<', $now)
            ->update(['estado' => 'Finalizada']);
    }

    /**
     * Comprueba la disponibilidad de un espacio para un mes específico.
     *
     * Devuelve los días del mes en los que el espacio está completamente ocupado
     * (el número de reservas activas alcanza o supera la capacidad del espacio).
     * Esto permite al calendario del frontend deshabilitar esos días.
     *
     * @param Request $request Parámetro de consulta 'mes' en formato 'YYYY-MM' (por defecto mes actual).
     * @param int $id Identificador del espacio a consultar.
     * @return \Illuminate\Http\JsonResponse Capacidad del espacio y array de días ocupados.
     */
    public function checkDisponibilidad(Request $request, $id)
    {
        $espacio = Espacio::find($id);
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        // Se obtiene el mes a consultar; por defecto se usa el mes actual
        $mes = $request->get('mes', Carbon::now()->format('Y-m'));
        $inicioMes = Carbon::parse($mes . '-01')->startOfMonth();
        $finMes = $inicioMes->copy()->endOfMonth();

        // Se obtienen las reservas activas (no canceladas) que se solapan con el mes solicitado
        $reservas = Reserva::where('id_espacio', $id)
            ->whereNotIn('estado', ['Cancelada'])
            ->where('fecha_inicio', '<', $finMes)
            ->where('fecha_fin', '>', $inicioMes)
            ->get(['fecha_inicio', 'fecha_fin']);

        // Se recorre cada día del mes y se cuenta cuántas reservas lo ocupan
        $diasOcupados = [];
        $capacidad = $espacio->capacidad;

        $dia = $inicioMes->copy();
        while ($dia <= $finMes) {
            $diaStr = $dia->format('Y-m-d');
            $count = 0;

            // Se comprueba cuántas reservas están activas para este día específico
            foreach ($reservas as $reserva) {
                $rInicio = Carbon::parse($reserva->fecha_inicio)->startOfDay();
                $rFin = Carbon::parse($reserva->fecha_fin)->startOfDay();

                if ($dia >= $rInicio && $dia <= $rFin) {
                    $count++;
                }
            }

            // Si el número de reservas iguala o supera la capacidad, el día se marca como ocupado
            if ($count >= $capacidad) {
                $diasOcupados[] = $diaStr;
            }

            $dia->addDay();
        }

        return response()->json([
            'capacidad' => $capacidad,
            'dias_ocupados' => $diasOcupados
        ]);
    }

    /**
     * Paso 1 del flujo de reserva: Crea una intención de pago en Stripe.
     *
     * Valida la disponibilidad del espacio para las fechas solicitadas, calcula el precio
     * total basado en el número de días y el precio por hora del espacio, y crea un
     * PaymentIntent en Stripe. No se guarda nada en la base de datos en este paso;
     * la reserva solo se registra tras la confirmación del pago (método store).
     *
     * La verificación de disponibilidad comprueba día a día que el número de reservas
     * no exceda la capacidad del espacio.
     *
     * @param Request $request Datos de la reserva (id_espacio, fecha_inicio, fecha_fin).
     * @return \Illuminate\Http\JsonResponse clientSecret de Stripe y detalles del monto.
     */
    public function createPaymentIntent(Request $request)
    {
        // Se valida que los datos de la reserva sean correctos
        $validator = Validator::make($request->all(), [
            'id_espacio' => 'required|exists:espacios,id_espacio',
            'fecha_inicio' => 'required|date|after:now',
            'fecha_fin' => 'required|date|after:fecha_inicio',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();
        if (!$user)
            return response()->json(['message' => 'Unauthorized'], 401);

        try {
            $espacio = Espacio::findOrFail($request->id_espacio);

            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);

            // Se verifica la disponibilidad día a día para asegurar que no se excede la capacidad
            $dia = $start->copy()->startOfDay();
            $finDia = $end->copy()->startOfDay();
            $capacidad = $espacio->capacidad;

            while ($dia <= $finDia) {
                // Se cuentan las reservas activas que se solapan con este día concreto
                $reservasEnDia = Reserva::where('id_espacio', $espacio->id_espacio)
                    ->whereNotIn('estado', ['Cancelada'])
                    ->where('fecha_inicio', '<=', $dia->copy()->endOfDay())
                    ->where('fecha_fin', '>', $dia->copy()->startOfDay())
                    ->count();

                // Si el espacio ya está completo para ese día, se rechaza la reserva
                if ($reservasEnDia >= $capacidad) {
                    return response()->json([
                        'status' => 'error',
                        'message' => 'El espacio no tiene disponibilidad para el día ' . $dia->format('d/m/Y') . '. Está completo (' . $capacidad . '/' . $capacidad . ' reservas).'
                    ], 409);
                }

                $dia->addDay();
            }

            // Se calcula el precio total basado en el número de días y el precio por hora del espacio
            $days = $start->diffInDays($end);
            if ($days < 1)
                $days = ceil($start->diffInHours($end) / 24);
            if ($days < 1)
                $days = 1;

            $montoTotal = $days * $espacio->precio_hora;
            $amountCents = (int) ($montoTotal * 100);

            // Se configura la clave secreta de Stripe y se crea el PaymentIntent
            $stripeSecret = trim(config('services.stripe.secret'));
            if (!$stripeSecret) {
                throw new \Exception("Stripe Secret not configured.");
            }
            \Stripe\Stripe::setApiKey($stripeSecret);

            // Se crea la intención de pago con los metadatos de la reserva para trazabilidad
            $paymentIntent = \Stripe\PaymentIntent::create([
                'amount' => $amountCents,
                'currency' => 'eur',
                'automatic_payment_methods' => ['enabled' => true],
                'metadata' => [
                    'user_id' => $user->id_usuario,
                    'espacio_id' => $espacio->id_espacio,
                    'fecha_inicio' => $request->fecha_inicio,
                    'fecha_fin' => $request->fecha_fin
                ],
                'description' => 'Reserva de espacio: ' . $espacio->titulo,
            ]);

            return response()->json([
                'status' => 'success',
                'clientSecret' => $paymentIntent->client_secret,
                'paymentIntentId' => $paymentIntent->id,
                'details' => [
                    'monto_total' => $montoTotal,
                    'days' => $days
                ]
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al iniciar pago',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Paso 2 del flujo de reserva: Confirma y guarda la reserva tras el pago exitoso.
     *
     * Se ejecuta después de que el frontend confirme el pago con Stripe. Verifica que
     * el PaymentIntent tenga estado 'succeeded', asegura que exista el registro de
     * Cliente en la base de datos (necesario para la clave foránea), recalcula el monto
     * total de la reserva y la guarda con estado 'Confirmada'. También registra el pago
     * en la tabla de pagos.
     *
     * @param Request $request payment_intent_id, id_espacio, fecha_inicio y fecha_fin.
     * @return \Illuminate\Http\JsonResponse Reserva creada o mensaje de error.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'payment_intent_id' => 'required|string',
            'id_espacio' => 'required|exists:espacios,id_espacio',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['status' => 'error', 'errors' => $validator->errors()], 422);
        }

        $user = $request->user();

        try {
            // Se verifica con Stripe que el pago haya sido completado exitosamente
            $stripeSecret = env('STRIPE_SECRET');
            \Stripe\Stripe::setApiKey($stripeSecret);

            $paymentIntent = \Stripe\PaymentIntent::retrieve($request->payment_intent_id);

            if ($paymentIntent->status !== 'succeeded') {
                return response()->json([
                    'status' => 'error',
                    'message' => 'El pago no ha sido completado/verificado (' . $paymentIntent->status . ')'
                ], 400);
            }

            // Se asegura que exista el registro de Cliente en la base de datos
            // para cumplir con la restricción de clave foránea de la tabla de reservas
            if (!\App\Models\Cliente::where('id_usuario', $user->id_usuario)->exists()) {
                \App\Models\Cliente::create(['id_usuario' => $user->id_usuario]);
            }

            // Se obtiene el espacio y se recalcula el monto total por seguridad
            $espacio = Espacio::findOrFail($request->id_espacio);

            $start = Carbon::parse($request->fecha_inicio);
            $end = Carbon::parse($request->fecha_fin);
            $days = $start->diffInDays($end);
            if ($days < 1)
                $days = ceil($start->diffInHours($end) / 24);
            if ($days < 1)
                $days = 1;

            $montoTotal = $days * $espacio->precio_hora;

            // Se crea la reserva con estado 'Confirmada' ya que el pago fue exitoso
            $reserva = Reserva::create([
                'id_cliente' => $user->id_usuario,
                'id_espacio' => $espacio->id_espacio,
                'fecha_inicio' => $start,
                'fecha_fin' => $end,
                'monto_total' => $montoTotal,
                'estado' => 'Confirmada',
            ]);

            // Se registra el pago en la tabla de pagos vinculado a la reserva recién creada
            \App\Models\Pago::create([
                'id_reserva' => $reserva->id_reserva,
                'monto_pagado' => $montoTotal,
                'metodo_pago' => 'Tarjeta',
                'estado_pago' => 'Completado'
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Reserva guardada y confirmada exitosamente',
                'reserva' => $reserva
            ], 201);

        } catch (\Exception $e) {
            return response()->json([
                'status' => 'error',
                'message' => 'Error al guardar la reserva',
                'debug' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Muestra los detalles de una reserva específica.
     *
     * @param int $id Identificador de la reserva.
     */
    public function show($id)
    {
    }

    /**
     * Lista las reservas de los espacios que pertenecen al anfitrión autenticado.
     *
     * Sincroniza automáticamente los estados de las reservas antes de devolverlas.
     * Incluye información del espacio (título, ciudad, dirección) con sus fotos,
     * y los datos del cliente que hizo la reserva. Se ordenan por fecha de inicio
     * descendente (las más recientes primero).
     *
     * @param Request $request Petición con el usuario autenticado.
     * @return \Illuminate\Http\JsonResponse Lista de reservas del anfitrión.
     */
    public function indexAnfitrion(Request $request)
    {
        $user = $request->user();

        // Se sincronizan los estados de las reservas antes de devolver el listado
        $this->autoSyncEstados();

        \Illuminate\Support\Facades\Log::info("Obteniendo reservas del anfitrión: " . $user->id_usuario);

        // Se buscan las reservas cuyos espacios pertenezcan al anfitrión autenticado
        $reservas = Reserva::whereHas('espacio', function ($query) use ($user) {
            $query->where('id_anfitrion', $user->id_usuario);
        })->with([
                    'espacio' => function ($query) {
                        $query->select('id_espacio', 'titulo', 'ciudad', 'direccion');
                    },
                    'espacio.fotos',
                    'usuario:id_usuario,nombre_completo,email,foto_perfil'
                ])
            ->orderBy('fecha_inicio', 'desc')
            ->get();

        return response()->json($reservas);
    }

    /**
     * Lista las reservas del cliente autenticado.
     *
     * Sincroniza automáticamente los estados de las reservas antes de devolverlas.
     * Incluye información del espacio reservado con sus fotos.
     * Se ordenan por fecha de inicio descendente.
     *
     * @param Request $request Petición con el usuario autenticado.
     * @return \Illuminate\Http\JsonResponse Lista de reservas del cliente.
     */
    public function indexCliente(Request $request)
    {
        $user = $request->user();

        // Se sincronizan los estados antes de devolver las reservas del cliente
        $this->autoSyncEstados();

        // Se obtienen las reservas del cliente con la información del espacio y sus fotos
        $reservas = Reserva::where('id_cliente', $user->id_usuario)
            ->with([
                'espacio' => function ($query) {
                    $query->select('id_espacio', 'titulo', 'ciudad', 'direccion', 'precio_hora');
                },
                'espacio.fotos'
            ])
            ->orderBy('fecha_inicio', 'desc')
            ->get();

        return response()->json($reservas);
    }

    /**
     * Cancela una reserva del cliente autenticado.
     *
     * Verifica que la reserva pertenezca al cliente que hace la solicitud.
     * Si la reserva ya está cancelada, devuelve un error para evitar operaciones redundantes.
     *
     * @param Request $request Petición con el usuario autenticado.
     * @param int $id Identificador de la reserva a cancelar.
     * @return \Illuminate\Http\JsonResponse Reserva cancelada o mensaje de error.
     */
    public function cancelar(Request $request, $id)
    {
        $user = $request->user();

        // Se busca la reserva verificando que pertenezca al cliente autenticado
        $reserva = Reserva::where('id_reserva', $id)
            ->where('id_cliente', $user->id_usuario)
            ->first();

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        // Se verifica que la reserva no esté ya cancelada para evitar operaciones redundantes
        if ($reserva->estado === 'Cancelada') {
            return response()->json(['message' => 'La reserva ya está cancelada'], 400);
        }

        $reserva->estado = 'Cancelada';
        $reserva->save();

        return response()->json(['message' => 'Reserva cancelada correctamente', 'reserva' => $reserva]);
    }

    /**
     * Permite al anfitrión cambiar el estado de una reserva de sus espacios.
     *
     * Verifica que la reserva pertenezca a un espacio del anfitrión autenticado.
     * Los estados válidos son: Confirmada, En_Curso, Finalizada y Cancelada.
     *
     * @param Request $request Contiene el nuevo estado de la reserva.
     * @param int $id Identificador de la reserva a actualizar.
     * @return \Illuminate\Http\JsonResponse Reserva actualizada o mensaje de error.
     */
    public function updateEstadoAnfitrion(Request $request, $id)
    {
        $user = $request->user();

        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:Confirmada,En_Curso,Finalizada,Cancelada',
        ]);

        if ($validator->fails()) {
            return response()->json(['message' => 'Estado no válido', 'errors' => $validator->errors()], 422);
        }

        // Se busca la reserva y se verifica que pertenezca a un espacio del anfitrión autenticado
        $reserva = Reserva::whereHas('espacio', function ($query) use ($user) {
            $query->where('id_anfitrion', $user->id_usuario);
        })->where('id_reserva', $id)->first();

        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada o no tienes permisos'], 404);
        }

        $reserva->estado = $request->estado;
        $reserva->save();

        return response()->json([
            'message' => 'Estado actualizado correctamente',
            'reserva' => $reserva
        ]);
    }
}
