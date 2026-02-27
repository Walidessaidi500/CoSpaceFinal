<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Reporte;
use App\Models\Espacio;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Validator;

/**
 * Controlador de Reportes (ReporteController)
 *
 * Este controlador gestiona el sistema de reportes de espacios de la plataforma CoSpace.
 * Permite a los clientes autenticados reportar espacios por motivos como fraude,
 * contenido inapropiado, información falsa, inseguridad o incumplimiento de normas.
 * Los administradores pueden listar todos los reportes, actualizar su estado
 * (Pendiente, Revisado, Resuelto, Rechazado) y eliminar reportes procesados.
 */
class ReporteController extends Controller
{
    /**
     * Crea un nuevo reporte sobre un espacio específico.
     *
     * Solo los usuarios con rol de 'Cliente' pueden crear reportes.
     * Se verifica que el espacio exista y que el usuario no haya reportado ya
     * el mismo espacio por el mismo motivo (evita duplicados).
     * Los motivos válidos son: reserva_fraudulenta, contenido_inapropiado,
     * informacion_falsa, espacio_inseguro, incumplimiento_normas y otro.
     *
     * @param Request $request Datos del reporte (motivo y descripción opcional).
     * @param int $id Identificador del espacio a reportar.
     * @return \Illuminate\Http\JsonResponse Reporte creado o mensaje de error.
     */
    public function store(Request $request, $id)
    {
        $usuario = Auth::user();

        if (!$usuario) {
            return response()->json(['message' => 'No autenticado'], 401);
        }

        // Solo los usuarios con rol de Cliente tienen permiso para reportar espacios
        if ($usuario->tipo_usuario !== 'Cliente') {
            return response()->json(['message' => 'Solo los clientes pueden reportar espacios'], 403);
        }

        // Se verifica que el espacio que se quiere reportar exista en la base de datos
        $espacio = Espacio::find($id);
        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'motivo' => 'required|string|in:reserva_fraudulenta,contenido_inapropiado,informacion_falsa,espacio_inseguro,incumplimiento_normas,otro',
            'descripcion' => 'nullable|string|max:1000',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        // Se comprueba si el usuario ya ha reportado este espacio por el mismo motivo para evitar duplicados
        $yaReportado = Reporte::where('id_espacio', $id)
            ->where('id_usuario', $usuario->id_usuario)
            ->where('motivo', $request->motivo)
            ->exists();

        if ($yaReportado) {
            return response()->json([
                'message' => 'Ya has reportado este espacio por este motivo'
            ], 409);
        }

        try {
            // Se crea el reporte con estado inicial 'Pendiente' para revisión del administrador
            $reporte = Reporte::create([
                'id_espacio' => $id,
                'id_usuario' => $usuario->id_usuario,
                'motivo' => $request->motivo,
                'descripcion' => $request->descripcion,
                'estado' => 'Pendiente',
            ]);

            return response()->json([
                'message' => 'Reporte enviado correctamente',
                'data' => $reporte
            ], 201);
        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al crear el reporte',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene la lista completa de todos los reportes (solo para administradores).
     *
     * Carga las relaciones de espacio y usuario para mostrar información detallada
     * de cada reporte: el espacio reportado, quién lo reportó, el motivo,
     * la descripción, el estado actual y la fecha del reporte.
     * Los reportes se ordenan del más reciente al más antiguo.
     *
     * @return \Illuminate\Http\JsonResponse Lista de todos los reportes formateados.
     */
    public function index()
    {
        // Se obtienen todos los reportes con datos selectivos del espacio y del usuario que reportó
        $reportes = Reporte::with(['espacio:id_espacio,titulo,ciudad', 'usuario:id_usuario,nombre_completo,email'])
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($reporte) {
                return [
                    'id' => $reporte->id_reporte,
                    'espacio' => $reporte->espacio ? $reporte->espacio->titulo : 'Espacio eliminado',
                    'espacio_ciudad' => $reporte->espacio ? $reporte->espacio->ciudad : '',
                    'usuario' => $reporte->usuario ? $reporte->usuario->nombre_completo : 'Usuario eliminado',
                    'usuario_email' => $reporte->usuario ? $reporte->usuario->email : '',
                    'motivo' => $reporte->motivo,
                    'descripcion' => $reporte->descripcion,
                    'estado' => $reporte->estado,
                    'fecha' => $reporte->created_at ? $reporte->created_at->format('d/m/Y H:i') : 'N/A',
                ];
            });

        return response()->json($reportes);
    }

    /**
     * Actualiza el estado de un reporte existente (solo para administradores).
     *
     * Permite al administrador cambiar el estado de un reporte a:
     * Pendiente, Revisado, Resuelto o Rechazado, según la acción que haya tomado.
     *
     * @param Request $request Contiene el nuevo estado del reporte.
     * @param int $id Identificador del reporte a actualizar.
     * @return \Illuminate\Http\JsonResponse Reporte actualizado o mensaje de error.
     */
    public function updateEstado(Request $request, $id)
    {
        $reporte = Reporte::find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'estado' => 'required|string|in:Pendiente,Revisado,Resuelto,Rechazado',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Estado inválido',
                'errors' => $validator->errors()
            ], 422);
        }

        $reporte->update(['estado' => $request->estado]);

        return response()->json([
            'message' => 'Estado del reporte actualizado',
            'data' => $reporte
        ]);
    }

    /**
     * Elimina un reporte específico de la base de datos (solo para administradores).
     *
     * @param int $id Identificador del reporte a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error 404.
     */
    public function destroy($id)
    {
        $reporte = Reporte::find($id);

        if (!$reporte) {
            return response()->json(['message' => 'Reporte no encontrado'], 404);
        }

        $reporte->delete();

        return response()->json(['message' => 'Reporte eliminado correctamente']);
    }
}
