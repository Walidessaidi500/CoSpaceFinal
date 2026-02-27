<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Valoracion;
use App\Models\Espacio;
use App\Models\Reserva;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * Controlador de Valoraciones (ValoracionController)
 *
 * Este controlador gestiona el sistema de reseñas y valoraciones de los espacios
 * de coworking en la plataforma CoSpace. Permite a los clientes que han reservado
 * un espacio escribir una reseña con puntuación de 1 a 5 estrellas y un comentario
 * opcional. También proporciona un listado público de valoraciones con filtros
 * por puntuación, ordenación y un resumen estadístico (promedio, distribución).
 */
class ValoracionController extends Controller
{
    /**
     * Obtiene las valoraciones de un espacio específico con filtros y resumen estadístico.
     *
     * Funcionalidades disponibles:
     * - Filtro por puntuación exacta (parámetro 'puntuacion': 1-5).
     * - Ordenación: 'reciente' (por defecto), 'antigua', 'mayor_puntuacion', 'menor_puntuacion'.
     * - Paginación de 10 valoraciones por página.
     * - Resumen global siempre calculado sobre TODAS las valoraciones (sin filtros):
     *   promedio general, total de reseñas y distribución porcentual por estrella.
     *
     * @param Request $request Parámetros de filtrado y ordenación.
     * @param int $id Identificador del espacio.
     * @return \Illuminate\Http\JsonResponse Resumen estadístico y lista paginada de valoraciones.
     */
    public function index(Request $request, $id)
    {
        try {
            $espacio = Espacio::find($id);
            if (!$espacio) {
                return response()->json(['message' => 'Espacio no encontrado'], 404);
            }

            // Se construye la consulta base con la relación del autor (nombre y foto de perfil)
            $query = Valoracion::where('id_espacio', $id)
                ->with(['autor:id_usuario,nombre_completo,foto_perfil']);

            // Si se proporciona un filtro de puntuación, se aplica para mostrar solo esa estrella
            if ($request->has('puntuacion') && $request->puntuacion) {
                $query->where('puntuacion', (int) $request->puntuacion);
            }

            // Se aplica la ordenación según el parámetro 'sort' recibido
            $sort = $request->get('sort', 'reciente');
            switch ($sort) {
                case 'antigua':
                    $query->orderBy('created_at', 'asc');
                    break;
                case 'mayor_puntuacion':
                    $query->orderBy('puntuacion', 'desc')->orderBy('created_at', 'desc');
                    break;
                case 'menor_puntuacion':
                    $query->orderBy('puntuacion', 'asc')->orderBy('created_at', 'desc');
                    break;
                case 'reciente':
                default:
                    $query->orderBy('created_at', 'desc');
                    break;
            }

            // Se paginan los resultados de 10 en 10
            $valoraciones = $query->paginate(10);

            // Se calcula el resumen estadístico sobre TODAS las valoraciones del espacio (sin los filtros aplicados)
            $todasValoraciones = Valoracion::where('id_espacio', $id);
            $total = $todasValoraciones->count();
            $promedio = $total > 0 ? round($todasValoraciones->avg('puntuacion'), 1) : 0;

            // Se calcula la distribución de valoraciones por cada nivel de puntuación (1 a 5 estrellas)
            $distribucion = [];
            for ($i = 5; $i >= 1; $i--) {
                $count = Valoracion::where('id_espacio', $id)->where('puntuacion', $i)->count();
                $distribucion[$i] = [
                    'puntuacion' => $i,
                    'count' => $count,
                    'porcentaje' => $total > 0 ? round(($count / $total) * 100) : 0
                ];
            }

            return response()->json([
                'resumen' => [
                    'promedio' => $promedio,
                    'total' => $total,
                    'distribucion' => $distribucion
                ],
                'valoraciones' => $valoraciones
            ]);

        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crea una nueva valoración para un espacio (solo clientes autenticados).
     *
     * Validaciones previas a la creación:
     * 1. El usuario debe estar autenticado y tener rol de 'Cliente'.
     * 2. El espacio debe existir en la base de datos.
     * 3. El cliente debe tener al menos una reserva en ese espacio.
     * 4. El cliente no debe haber escrito ya una reseña para ese espacio (solo una por espacio).
     *
     * Después de crear la valoración, se recalcula automáticamente el rating_promedio
     * y el total_resenas del espacio para mantener los datos actualizados.
     * Toda la operación se ejecuta dentro de una transacción para garantizar la integridad.
     *
     * @param Request $request Puntuación (1-5) y comentario opcional (máx. 1000 caracteres).
     * @param int $id Identificador del espacio a valorar.
     * @return \Illuminate\Http\JsonResponse Valoración creada o mensaje de error.
     */
    public function store(Request $request, $id)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Solo los usuarios con rol de Cliente pueden escribir reseñas sobre los espacios
        if ($usuario->tipo_usuario !== 'Cliente') {
            return response()->json(['message' => 'Solo los clientes pueden escribir reseñas'], 403);
        }

        $espacio = Espacio::find($id);
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        // Se verifica que el cliente tenga al menos una reserva en este espacio (requisito para valorar)
        $tieneReservaFinalizada = Reserva::where('id_cliente', $usuario->id_usuario)
            ->where('id_espacio', $id)
            ->exists();

        if (!$tieneReservaFinalizada) {
            return response()->json([
                'message' => 'Debes tener una reserva en este espacio para poder escribir una reseña'
            ], 403);
        }

        // Se verifica que el cliente no haya escrito ya una reseña para este espacio (solo una por espacio)
        $yaValorado = Valoracion::where('id_espacio', $id)
            ->where('id_usuario', $usuario->id_usuario)
            ->exists();

        if ($yaValorado) {
            return response()->json([
                'message' => 'Ya has escrito una reseña para este espacio'
            ], 409);
        }

        $validator = Validator::make($request->all(), [
            'puntuacion' => 'required|integer|min:1|max:5',
            'comentario' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request, $id, $usuario, $espacio) {
                // Se busca la reserva más reciente del cliente en este espacio para vincularla a la valoración
                $reserva = Reserva::where('id_cliente', $usuario->id_usuario)
                    ->where('id_espacio', $id)
                    ->latest()
                    ->first();

                // Se crea la valoración vinculada a la reserva, el espacio y el usuario
                $valoracion = Valoracion::create([
                    'id_reserva' => $reserva->id_reserva,
                    'id_espacio' => $id,
                    'id_usuario' => $usuario->id_usuario,
                    'puntuacion' => $request->puntuacion,
                    'comentario' => $request->comentario,
                ]);

                // Se recalculan el promedio de puntuación y el total de reseñas del espacio
                $stats = Valoracion::where('id_espacio', $id)
                    ->selectRaw('COUNT(*) as total, ROUND(AVG(puntuacion), 2) as promedio')
                    ->first();

                // Se actualizan los campos de estadísticas del espacio con los valores recalculados
                $espacio->update([
                    'rating_promedio' => $stats->promedio ?? 0,
                    'total_resenas' => $stats->total ?? 0,
                ]);

                return response()->json([
                    'message' => 'Valoración creada exitosamente',
                    'data' => $valoracion->load('autor:id_usuario,nombre_completo,foto_perfil')
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear la valoración',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
