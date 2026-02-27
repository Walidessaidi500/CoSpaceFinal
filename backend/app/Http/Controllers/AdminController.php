<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Espacio;
use App\Models\Reserva;
use App\Models\Pago;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Controlador de Administración (AdminController)
 *
 * Este controlador centraliza todas las operaciones administrativas de la plataforma CoSpace.
 * Proporciona métodos para obtener estadísticas del panel de control, gestionar espacios,
 * usuarios, reservas y pagos. Solo debe ser accesible por usuarios con rol de administrador.
 */
class AdminController extends Controller
{
    /**
     * Obtiene las estadísticas generales del panel de administración (Dashboard).
     *
     * Este método recopila y calcula las siguientes métricas:
     * - Total de usuarios registrados y su variación porcentual respecto al mes anterior.
     * - Espacios activos (con estado 'Disponible') y su variación porcentual mensual.
     * - Número de reservas realizadas en el mes actual y su comparación con el mes anterior.
     * - Ingresos del mes calculados como una comisión del 14.59% sobre el monto bruto de reservas.
     * - Las 4 reservas más recientes con datos del usuario y espacio asociado.
     * - Los 4 espacios más populares ordenados por número de reservas, incluyendo su valoración promedio.
     *
     * @return \Illuminate\Http\JsonResponse Respuesta JSON con todas las estadísticas del dashboard.
     */
    public function getDashboardStats()
    {
        // Se establece el idioma de Carbon en español para que las fechas relativas se muestren en castellano
        Carbon::setLocale('es');

        // Se obtiene la fecha y hora actual y se calcula la correspondiente al mes anterior
        $now = Carbon::now();
        $lastMonth = $now->copy()->subMonth();

        // --- Cálculo del total de usuarios registrados y su variación mensual ---
        // Se cuenta el total de usuarios en la base de datos
        $totalUsuarios = Usuario::count();
        // Se cuentan los usuarios registrados durante el mes actual
        $usuariosEsteMes = Usuario::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();
        // Se cuentan los usuarios registrados durante el mes anterior para comparar
        $usuariosMesPasado = Usuario::whereMonth('created_at', $lastMonth->month)->whereYear('created_at', $lastMonth->year)->count();
        // Se calcula el porcentaje de variación entre ambos meses; si el mes pasado fue 0, se establece 100% o 0%
        $cambioUsuarios = $usuariosMesPasado > 0 ? (($usuariosEsteMes - $usuariosMesPasado) / $usuariosMesPasado) * 100 : ($usuariosEsteMes > 0 ? 100 : 0);
        // Se formatea el porcentaje como cadena con signo positivo o negativo
        $cambioUsuariosStr = ($cambioUsuarios >= 0 ? '+' : '') . number_format($cambioUsuarios, 0) . '%';

        // --- Cálculo de los espacios activos (estado 'Disponible') y su variación mensual ---
        // Se cuentan únicamente los espacios cuyo estado es 'Disponible' (no los que están en mantenimiento, etc.)
        $espaciosActivos = Espacio::where('estado', 'Disponible')->count();
        // Se cuentan los espacios marcados como 'Disponible' creados durante el mes actual
        $espaciosEsteMes = Espacio::where('estado', 'Disponible')->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->count();
        // Se cuentan los del mes anterior para la comparación
        $espaciosMesPasado = Espacio::where('estado', 'Disponible')->whereMonth('created_at', $lastMonth->month)->whereYear('created_at', $lastMonth->year)->count();
        // Se calcula el porcentaje de variación mensual de espacios activos
        $cambioEspacios = $espaciosMesPasado > 0 ? (($espaciosEsteMes - $espaciosMesPasado) / $espaciosMesPasado) * 100 : ($espaciosEsteMes > 0 ? 100 : 0);
        $cambioEspaciosStr = ($cambioEspacios >= 0 ? '+' : '') . number_format($cambioEspacios, 0) . '%';

        // --- Cálculo de las reservas del mes actual y su variación mensual ---
        // Se cuenta el número total de reservas creadas durante el mes actual
        $reservasMes = Reserva::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->count();
        // Se cuenta el número de reservas del mes anterior para la comparación
        $reservasMesPasado = Reserva::whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->count();
        // Se calcula el porcentaje de variación entre el mes actual y el anterior
        $cambioReservas = $reservasMesPasado > 0 ? (($reservasMes - $reservasMesPasado) / $reservasMesPasado) * 100 : ($reservasMes > 0 ? 100 : 0);
        $cambioReservasStr = ($cambioReservas >= 0 ? '+' : '') . number_format($cambioReservas, 0) . '%';

        // --- Cálculo de los ingresos mensuales de la plataforma ---
        // Los ingresos de la plataforma corresponden a una comisión del 14.59% (gastos de gestión)
        // aplicada sobre el monto bruto total de todas las reservas del mes
        $totalBrutoMes = Reserva::whereMonth('created_at', $now->month)
            ->whereYear('created_at', $now->year)
            ->sum('monto_total');
        // Se aplica la comisión del 14.59% para obtener el ingreso neto de la plataforma
        $ingresosMes = $totalBrutoMes * 0.1459;

        // Se realiza el mismo cálculo para el mes anterior y así poder comparar
        $totalBrutoMesAnterior = Reserva::whereMonth('created_at', $lastMonth->month)
            ->whereYear('created_at', $lastMonth->year)
            ->sum('monto_total');
        $ingresosMesAnterior = $totalBrutoMesAnterior * 0.1459;

        // Se calcula la variación porcentual de ingresos entre ambos meses
        $cambioIngresos = $ingresosMesAnterior > 0 ? (($ingresosMes - $ingresosMesAnterior) / $ingresosMesAnterior) * 100 : ($ingresosMes > 0 ? 100 : 0);
        $cambioIngresosStr = ($cambioIngresos >= 0 ? '+' : '') . number_format($cambioIngresos, 0) . '%';

        // --- Obtención de las 4 reservas más recientes para mostrar en el dashboard ---
        // Se cargan las relaciones 'usuario' y 'espacio' para evitar consultas adicionales (eager loading)
        $ultimasReservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('created_at', 'desc')
            ->take(4)
            ->get()
            ->map(function ($reserva) {
                // Se transforma cada reserva en un array con la información necesaria para el frontend
                return [
                    'user' => $reserva->usuario ? $reserva->usuario->nombre_completo : 'Usuario Eliminado',
                    'space' => $reserva->espacio ? $reserva->espacio->titulo : 'Espacio Eliminado',
                    'amount' => '€' . number_format($reserva->monto_total, 2),
                    // Se usa diffForHumans() para mostrar la fecha en formato relativo (ej: "hace 2 horas")
                    'date' => Carbon::parse($reserva->created_at)->diffForHumans(),
                    // Si el usuario tiene foto de perfil se usa; en caso contrario se genera un avatar automático
                    'avatar' => $reserva->usuario && $reserva->usuario->foto_perfil
                        ? asset('storage/' . $reserva->usuario->foto_perfil)
                        : 'https://ui-avatars.com/api/?name=' . urlencode(optional($reserva->usuario)->nombre_completo ?? 'U') . '&background=random'
                ];
            });

        // --- Obtención de los 4 espacios más populares ordenados por número de reservas ---
        // Se usa withCount para contar las reservas asociadas a cada espacio de forma eficiente
        $espaciosPopulares = Espacio::withCount('reservas')
            ->orderBy('reservas_count', 'desc')
            ->take(4)
            ->get()
            ->map(function ($espacio) {
                // Se transforma cada espacio en un array con su información y valoración promedio
                return [
                    'id' => $espacio->id_espacio,
                    'name' => $espacio->titulo,
                    'reservas' => $espacio->reservas_count,
                    // Se redondea la valoración promedio a 1 decimal; si no existe se muestra 0
                    'rating' => round($espacio->rating_promedio ?? 0, 1)
                ];
            });

        // Se retorna toda la información del dashboard como respuesta JSON estructurada
        return response()->json([
            'stats' => [
                'usuarios' => [
                    'value' => number_format($totalUsuarios),
                    'change' => $cambioUsuariosStr
                ],
                'espacios' => [
                    'value' => number_format($espaciosActivos),
                    'change' => $cambioEspaciosStr
                ],
                'reservas' => [
                    'value' => number_format($reservasMes),
                    'change' => $cambioReservasStr
                ],
                'ingresos' => [
                    'value' => '€' . number_format($ingresosMes, 2),
                    'change' => $cambioIngresosStr
                ]
            ],
            'recentReservations' => $ultimasReservas,
            'popularSpaces' => $espaciosPopulares
        ]);
    }

    /**
     * Obtiene la lista completa de todos los espacios registrados en la plataforma.
     *
     * Carga de forma anticipada (eager loading) las relaciones 'anfitrion.usuario' y 'reservas'
     * para mostrar el nombre del anfitrión y el número total de reservas de cada espacio.
     * Los espacios se devuelven ordenados de más reciente a más antiguo.
     *
     * @return \Illuminate\Http\JsonResponse Lista de espacios con sus datos formateados.
     */
    public function getAllSpaces()
    {
        // Se obtienen todos los espacios con sus relaciones cargadas y se ordenan por fecha descendente
        $espacios = Espacio::with(['anfitrion.usuario', 'reservas'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($espacio) {
                // Se intenta obtener el nombre completo del anfitrión a través de la relación encadenada
                $nombreAnfitrion = 'Desconocido';
                if ($espacio->anfitrion && $espacio->anfitrion->usuario) {
                    $nombreAnfitrion = $espacio->anfitrion->usuario->nombre_completo;
                }

                // Se devuelve un array formateado con los datos esenciales del espacio
                return [
                    'id' => $espacio->id_espacio,
                    'titulo' => $espacio->titulo,
                    'ciudad' => $espacio->ciudad,
                    'direccion' => $espacio->direccion,
                    'precio_hora' => $espacio->precio_hora,
                    'estado' => $espacio->estado,
                    'anfitrion' => $nombreAnfitrion,
                    'reservas_count' => $espacio->reservas->count(),
                    'created_at' => $espacio->created_at ? $espacio->created_at->format('d/m/Y') : 'N/A',
                ];
            });

        return response()->json($espacios);
    }

    /**
     * Elimina un espacio específico de la base de datos.
     *
     * Busca el espacio por su identificador. Si no se encuentra, devuelve un error 404.
     * Si se encuentra, lo elimina permanentemente de la base de datos.
     *
     * @param int $id Identificador único del espacio a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error.
     */
    public function destroy($id)
    {
        // Se busca el espacio por su ID en la base de datos
        $espacio = Espacio::find($id);

        // Si el espacio no existe, se devuelve una respuesta de error 404
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        // Se elimina el espacio de la base de datos
        $espacio->delete();

        return response()->json(['message' => 'Espacio eliminado correctamente par el administrador']);
    }

    /**
     * Actualiza los datos de un espacio existente.
     *
     * Valida los campos enviados en la petición (todos opcionales gracias a 'sometimes')
     * y actualiza únicamente los campos proporcionados. Si se envía un array de servicios,
     * se sincronizan los servicios asociados al espacio mediante la tabla intermedia.
     *
     * @param Request $request Datos de la petición con los campos a actualizar.
     * @param int $id Identificador único del espacio a actualizar.
     * @return \Illuminate\Http\JsonResponse Espacio actualizado o mensaje de error.
     */
    public function update(Request $request, $id)
    {
        // Se busca el espacio por su ID
        $espacio = Espacio::find($id);

        // Si no existe, se devuelve un error 404
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        // Se validan los datos recibidos; 'sometimes' permite actualizar solo los campos enviados
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:100',
            'ciudad' => 'sometimes|required|string|max:100',
            'direccion' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string|min:20',
            'precio_hora' => 'sometimes|required|numeric|min:0',
            'capacidad' => 'sometimes|required|integer|min:1',
            'estado' => 'sometimes|string',
        ]);

        // Si la validación falla, se devuelven los errores con código 422 (entidad no procesable)
        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        // Se actualizan solo los campos permitidos del espacio
        $espacio->update($request->only([
            'titulo',
            'ciudad',
            'direccion',
            'descripcion',
            'precio_hora',
            'capacidad',
            'estado',
            'latitud',
            'longitud'
        ]));

        // Si se enviaron servicios, se sincronizan en la tabla pivote (relación muchos a muchos)
        if ($request->has('servicios')) {
            $espacio->servicios()->sync($request->servicios);
        }

        return response()->json([
            'message' => 'Espacio actualizado por admin exitosamente',
            'data' => $espacio
        ]);
    }

    // ==========================================
    // SECCIÓN: Gestión de Usuarios
    // ==========================================

    /**
     * Obtiene la lista completa de todos los usuarios registrados en la plataforma.
     *
     * Devuelve los usuarios ordenados de más reciente a más antiguo, incluyendo
     * su nombre, correo electrónico, rol, estado de la cuenta y fecha de registro.
     *
     * @return \Illuminate\Http\JsonResponse Lista de usuarios formateada.
     */
    public function getAllUsers()
    {
        // Se obtienen todos los usuarios ordenados por fecha de creación descendente
        $users = Usuario::orderBy('created_at', 'desc')
            ->get()
            ->map(function ($user) {
                // Se transforma cada usuario en un array con los campos necesarios para el panel
                return [
                    'id' => $user->id_usuario,
                    'nombre' => $user->nombre_completo,
                    'email' => $user->email,
                    'rol' => $user->tipo_usuario,
                    'estado_cuenta' => $user->estado_cuenta,
                    'fecha_registro' => $user->created_at ? $user->created_at->format('d/m/Y') : 'N/A',
                ];
            });

        return response()->json($users);
    }

    /**
     * Elimina un usuario específico de la base de datos.
     *
     * Incluye una protección para evitar que el administrador se elimine a sí mismo
     * desde el panel de administración. Si el usuario no se encuentra, devuelve error 404.
     *
     * @param int $id Identificador único del usuario a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error.
     */
    public function destroyUser($id)
    {
        // Se busca el usuario por su ID
        $user = Usuario::find($id);

        // Si el usuario no existe, se devuelve una respuesta 404
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Se impide que el administrador pueda eliminarse a sí mismo desde este panel
        if ($user->id_usuario == auth()->id()) {
            return response()->json(['message' => 'No puedes eliminar tu propia cuenta desde aquí'], 403);
        }

        // Se elimina el usuario de la base de datos
        $user->delete();

        return response()->json(['message' => 'Usuario eliminado correctamente']);
    }

    /**
     * Actualiza los datos de un usuario existente.
     *
     * Permite modificar el nombre, email, tipo de usuario (rol) y estado de la cuenta.
     * La validación del email incluye una regla de unicidad que excluye al propio usuario
     * para evitar conflictos cuando no se cambia el correo electrónico.
     *
     * @param Request $request Datos de la petición con los campos a actualizar.
     * @param int $id Identificador único del usuario a actualizar.
     * @return \Illuminate\Http\JsonResponse Usuario actualizado o mensaje de error.
     */
    public function updateUser(Request $request, $id)
    {
        // Se busca el usuario por su ID
        $user = Usuario::find($id);

        // Si no existe, se devuelve un error 404
        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Se validan los datos; la regla unique del email excluye al usuario actual para evitar conflictos
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'nombre_completo' => 'sometimes|required|string|max:255',
            'email' => 'sometimes|required|email|max:255|unique:usuarios,email,' . $id . ',id_usuario',
            'tipo_usuario' => 'sometimes|required|string|in:Cliente,Anfitrion,Admin',
            'estado_cuenta' => 'sometimes|required|string|in:Activo,Suspendido,Pendiente',
        ]);

        // Si la validación falla, se devuelven los errores detallados
        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        // Se actualizan solo los campos permitidos del usuario
        $user->update($request->only(['nombre_completo', 'email', 'tipo_usuario', 'estado_cuenta']));

        return response()->json([
            'message' => 'Usuario actualizado exitosamente',
            'data' => $user
        ]);
    }

    // ==========================================
    // SECCIÓN: Gestión de Reservas
    // ==========================================

    /**
     * Obtiene la lista completa de todas las reservas de la plataforma.
     *
     * Antes de devolver las reservas, ejecuta una sincronización automática de estados:
     * - Las reservas 'Confirmada' cuya fecha de inicio ya pasó y aún no finalizó se marcan como 'En_Curso'.
     * - Las reservas 'Confirmada' o 'En_Curso' cuya fecha de fin ya pasó se marcan como 'Finalizada'.
     * Esto garantiza que los estados reflejen siempre la situación real sin intervención manual.
     *
     * @return \Illuminate\Http\JsonResponse Lista completa de reservas con sus datos formateados.
     */
    public function getAllReservations()
    {
        $now = Carbon::now();

        // Se actualizan automáticamente las reservas confirmadas que ya deberían estar en curso
        // (la fecha de inicio ya pasó pero la fecha de fin aún no ha llegado)
        Reserva::where('estado', 'Confirmada')
            ->where('fecha_inicio', '<=', $now)
            ->where('fecha_fin', '>=', $now)
            ->update(['estado' => 'En_Curso']);

        // Se actualizan automáticamente las reservas que ya deberían haber finalizado
        // (la fecha de fin ya pasó, tanto las que estaban confirmadas como las que estaban en curso)
        Reserva::whereIn('estado', ['Confirmada', 'En_Curso'])
            ->where('fecha_fin', '<', $now)
            ->update(['estado' => 'Finalizada']);

        // Se obtienen todas las reservas con sus relaciones de usuario y espacio cargadas
        $reservas = Reserva::with(['usuario', 'espacio'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($reserva) {
                // Se transforma cada reserva en un array con los datos necesarios para el panel
                return [
                    'id' => $reserva->id_reserva,
                    'cliente' => $reserva->usuario ? $reserva->usuario->nombre_completo : 'Usuario Eliminado',
                    'espacio' => $reserva->espacio ? $reserva->espacio->titulo : 'Espacio Eliminado',
                    'fecha_inicio' => $reserva->fecha_inicio ? $reserva->fecha_inicio->format('d/m/Y H:i') : 'N/A',
                    'fecha_fin' => $reserva->fecha_fin ? $reserva->fecha_fin->format('d/m/Y H:i') : 'N/A',
                    'monto_total' => $reserva->monto_total,
                    'estado' => $reserva->estado,
                ];
            });

        return response()->json($reservas);
    }

    /**
     * Elimina una reserva específica de la base de datos.
     *
     * Busca la reserva por su identificador. Si no se encuentra, devuelve error 404.
     * Si se encuentra, la elimina permanentemente.
     *
     * @param int $id Identificador único de la reserva a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error.
     */
    public function destroyReservation($id)
    {
        // Se busca la reserva por su ID
        $reserva = Reserva::find($id);

        // Si la reserva no existe, se devuelve un error 404
        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        // Se elimina la reserva de la base de datos
        $reserva->delete();

        return response()->json(['message' => 'Reserva eliminada correctamente']);
    }

    /**
     * Actualiza los datos de una reserva existente.
     *
     * Permite al administrador modificar el estado y el monto total de una reserva.
     * Los estados válidos son: Pendiente, Confirmada, En_Curso, Finalizada y Cancelada.
     *
     * @param Request $request Datos de la petición con los campos a actualizar.
     * @param int $id Identificador único de la reserva a actualizar.
     * @return \Illuminate\Http\JsonResponse Reserva actualizada o mensaje de error.
     */
    public function updateReservation(Request $request, $id)
    {
        // Se busca la reserva por su ID
        $reserva = Reserva::find($id);

        // Si no existe, se devuelve un error 404
        if (!$reserva) {
            return response()->json(['message' => 'Reserva no encontrada'], 404);
        }

        // Se validan los datos recibidos; solo se permiten estados y montos válidos
        $validator = \Illuminate\Support\Facades\Validator::make($request->all(), [
            'estado' => 'sometimes|required|string|in:Pendiente,Confirmada,En_Curso,Finalizada,Cancelada',
            'monto_total' => 'sometimes|numeric|min:0'
        ]);

        // Si la validación falla, se devuelven los errores detallados
        if ($validator->fails()) {
            return response()->json(['message' => 'Datos inválidos', 'errors' => $validator->errors()], 422);
        }

        // Se actualizan solo los campos permitidos de la reserva
        $reserva->update($request->only(['estado', 'monto_total']));

        return response()->json([
            'message' => 'Reserva actualizada exitosamente',
            'data' => $reserva
        ]);
    }

    // ==========================================
    // SECCIÓN: Gestión de Pagos
    // ==========================================

    /**
     * Obtiene la lista completa de todos los pagos registrados en la plataforma.
     *
     * Carga de forma anticipada las relaciones necesarias (reserva, usuario del cliente y espacio)
     * para mostrar información detallada de cada pago sin realizar consultas adicionales.
     * Los pagos se devuelven ordenados del más reciente al más antiguo.
     *
     * @return \Illuminate\Http\JsonResponse Lista completa de pagos con sus datos formateados.
     */
    public function getAllPagos()
    {
        // Se obtienen todos los pagos con sus relaciones encadenadas cargadas mediante eager loading
        $pagos = \App\Models\Pago::with([
            'reserva',
            'reserva.usuario',
            'reserva.espacio'
        ])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($pago) {
                // Se transforma cada pago en un array con la información necesaria para el panel
                // Se usa optional() para evitar errores si alguna relación fue eliminada
                return [
                    'id' => $pago->id_pago,
                    'id_reserva' => $pago->id_reserva,
                    'cliente' => optional(optional($pago->reserva)->usuario)->nombre_completo ?? 'N/A',
                    'email' => optional(optional($pago->reserva)->usuario)->email ?? 'N/A',
                    'espacio' => optional(optional($pago->reserva)->espacio)->titulo ?? 'N/A',
                    'monto' => $pago->monto_pagado,
                    'metodo_pago' => $pago->metodo_pago ?? 'Tarjeta',
                    'estado_pago' => $pago->estado_pago ?? 'Completado',
                    'fecha_pago' => $pago->created_at ? $pago->created_at->format('d/m/Y H:i') : 'N/A',
                    // El campo id_transaccion se mantiene vacío ya que esta columna fue eliminada de la base de datos
                    'id_transaccion' => '',
                ];
            });

        return response()->json($pagos);
    }

    /**
     * Elimina un pago específico de la base de datos.
     *
     * Busca el pago por su identificador. Si no se encuentra, devuelve error 404.
     * Si se encuentra, lo elimina permanentemente de la base de datos.
     *
     * @param int $id Identificador único del pago a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error.
     */
    public function destroyPago($id)
    {
        // Se busca el pago por su ID en la base de datos
        $pago = \App\Models\Pago::find($id);

        // Si el pago no existe, se devuelve un error 404
        if (!$pago) {
            return response()->json(['message' => 'Pago no encontrado'], 404);
        }

        // Se elimina el pago de la base de datos
        $pago->delete();

        return response()->json(['message' => 'Pago eliminado correctamente']);
    }
}
