<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Conversacion;
use App\Models\Mensaje;

/**
 * Controlador del Chat (ChatController)
 *
 * Este controlador gestiona el sistema de mensajería interna de la plataforma CoSpace.
 * Permite a los usuarios (clientes y anfitriones) comunicarse entre sí mediante
 * conversaciones privadas. Incluye funcionalidades para listar conversaciones,
 * crear nuevas, enviar mensajes, obtener el historial de mensajes y contar
 * los mensajes no leídos del usuario autenticado.
 */
class ChatController extends Controller
{
    /**
     * Obtiene todas las conversaciones del usuario autenticado.
     *
     * Para cada conversación, se devuelve la información del otro participante,
     * el último mensaje enviado, el número de mensajes no leídos y las fechas
     * de creación y última actualización. Las conversaciones se ordenan por
     * actividad más reciente (último mensaje o fecha de creación).
     *
     * @return \Illuminate\Http\JsonResponse Lista de conversaciones del usuario ordenadas por actividad.
     */
    public function index()
    {
        $userId = Auth::id();

        // Se obtienen todas las conversaciones donde el usuario es participante (como usuario_1 o usuario_2)
        $conversaciones = Conversacion::where('id_usuario_1', $userId)
            ->orWhere('id_usuario_2', $userId)
            ->with(['usuario1', 'usuario2', 'ultimoMensaje'])
            ->get()
            ->map(function ($conv) use ($userId) {
                // Se identifica al otro participante de la conversación
                $otroUsuario = $conv->getOtroUsuario($userId);
                return [
                    'id_conv' => $conv->id_conv,
                    'otro_usuario' => [
                        'id_usuario' => $otroUsuario->id_usuario ?? null,
                        'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                        'foto_perfil' => $otroUsuario->foto_perfil ?? null,
                    ],
                    'ultimo_mensaje' => $conv->ultimoMensaje ? [
                        'contenido' => $conv->ultimoMensaje->contenido,
                        'created_at' => $conv->ultimoMensaje->created_at,
                        'es_mio' => $conv->ultimoMensaje->id_emisor == $userId,
                    ] : null,
                    'no_leidos' => $conv->mensajesNoLeidos($userId),
                    'created_at' => $conv->created_at,
                    'updated_at' => $conv->updated_at,
                ];
            })
            // Se ordenan las conversaciones por la fecha del último mensaje (las más recientes primero)
            ->sortByDesc(function ($conv) {
                return $conv['ultimo_mensaje']['created_at'] ?? $conv['created_at'];
            })
            ->values();

        return response()->json($conversaciones);
    }

    /**
     * Crea una nueva conversación entre el usuario autenticado y otro usuario.
     *
     * Si ya existe una conversación entre ambos participantes, se devuelve la existente
     * sin crear una duplicada. Si no existe, se crea una nueva conversación.
     * No se permite que un usuario inicie una conversación consigo mismo.
     *
     * @param Request $request Contiene el campo 'id_usuario_destino' con el ID del otro participante.
     * @return \Illuminate\Http\JsonResponse Datos de la conversación (nueva o existente).
     */
    public function store(Request $request)
    {
        $request->validate([
            'id_usuario_destino' => 'required|integer|exists:usuarios,id_usuario',
        ]);

        $userId = Auth::id();
        $destinoId = $request->id_usuario_destino;

        // Se impide que un usuario pueda iniciar una conversación consigo mismo
        if ($userId == $destinoId) {
            return response()->json(['message' => 'No puedes iniciar una conversación contigo mismo'], 422);
        }

        // Se busca si ya existe una conversación entre ambos usuarios (en cualquier orden)
        $conversacion = Conversacion::where(function ($q) use ($userId, $destinoId) {
            $q->where('id_usuario_1', $userId)->where('id_usuario_2', $destinoId);
        })->orWhere(function ($q) use ($userId, $destinoId) {
            $q->where('id_usuario_1', $destinoId)->where('id_usuario_2', $userId);
        })->first();

        if ($conversacion) {
            // Si ya existe la conversación, se devuelve con los datos del otro participante
            $conversacion->load(['usuario1', 'usuario2']);
            $otroUsuario = $conversacion->getOtroUsuario($userId);

            return response()->json([
                'id_conv' => $conversacion->id_conv,
                'otro_usuario' => [
                    'id_usuario' => $otroUsuario->id_usuario ?? null,
                    'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                    'foto_perfil' => $otroUsuario->foto_perfil ?? null,
                ],
                'nueva' => false,
            ]);
        }

        // Si no existe, se crea una nueva conversación entre ambos usuarios
        $conversacion = Conversacion::create([
            'id_usuario_1' => $userId,
            'id_usuario_2' => $destinoId,
        ]);

        $conversacion->load(['usuario1', 'usuario2']);
        $otroUsuario = $conversacion->getOtroUsuario($userId);

        return response()->json([
            'id_conv' => $conversacion->id_conv,
            'otro_usuario' => [
                'id_usuario' => $otroUsuario->id_usuario ?? null,
                'nombre_completo' => $otroUsuario->nombre_completo ?? 'Usuario',
                'foto_perfil' => $otroUsuario->foto_perfil ?? null,
            ],
            'nueva' => true,
        ], 201);
    }

    /**
     * Obtiene todos los mensajes de una conversación específica.
     *
     * Antes de devolver los mensajes, marca como leídos todos los mensajes
     * que no fueron enviados por el usuario actual (es decir, los mensajes recibidos).
     * Los mensajes se devuelven ordenados cronológicamente de más antiguo a más reciente.
     * Se verifica que el usuario pertenezca a la conversación antes de mostrar los mensajes.
     *
     * @param int $id Identificador de la conversación.
     * @return \Illuminate\Http\JsonResponse Lista de mensajes de la conversación o error 404.
     */
    public function mensajes($id)
    {
        $userId = Auth::id();

        // Se verifica que el usuario autenticado sea uno de los participantes de la conversación
        $conversacion = Conversacion::where('id_conv', $id)
            ->where(function ($q) use ($userId) {
                $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
            })
            ->first();

        if (!$conversacion) {
            return response()->json(['message' => 'Conversación no encontrada'], 404);
        }

        // Se marcan como leídos todos los mensajes enviados por el otro participante
        Mensaje::where('id_conv', $id)
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->update(['leido' => true]);

        // Se obtienen todos los mensajes con los datos del emisor, ordenados cronológicamente
        $mensajes = Mensaje::where('id_conv', $id)
            ->with('emisor')
            ->orderBy('created_at', 'asc')
            ->get()
            ->map(function ($msg) use ($userId) {
                return [
                    'id_mensaje' => $msg->id_mensaje,
                    'contenido' => $msg->contenido,
                    'es_mio' => $msg->id_emisor == $userId,
                    'emisor' => [
                        'id_usuario' => $msg->emisor->id_usuario ?? null,
                        'nombre_completo' => $msg->emisor->nombre_completo ?? 'Usuario',
                    ],
                    'leido' => $msg->leido,
                    'created_at' => $msg->created_at,
                ];
            });

        return response()->json($mensajes);
    }

    /**
     * Envía un nuevo mensaje dentro de una conversación existente.
     *
     * Verifica que el usuario pertenezca a la conversación antes de permitir el envío.
     * Tras crear el mensaje, se actualiza el timestamp de la conversación para que
     * aparezca como la más reciente en el listado de conversaciones.
     *
     * @param Request $request Contiene el campo 'contenido' con el texto del mensaje (máx. 2000 caracteres).
     * @param int $id Identificador de la conversación.
     * @return \Illuminate\Http\JsonResponse Datos del mensaje enviado o error 404.
     */
    public function enviarMensaje(Request $request, $id)
    {
        $request->validate([
            'contenido' => 'required|string|max:2000',
        ]);

        $userId = Auth::id();

        // Se verifica que el usuario autenticado sea participante de la conversación
        $conversacion = Conversacion::where('id_conv', $id)
            ->where(function ($q) use ($userId) {
                $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
            })
            ->first();

        if (!$conversacion) {
            return response()->json(['message' => 'Conversación no encontrada'], 404);
        }

        // Se crea el nuevo mensaje con estado 'no leído' por defecto
        $mensaje = Mensaje::create([
            'id_conv' => $id,
            'id_emisor' => $userId,
            'contenido' => $request->contenido,
            'leido' => false,
        ]);

        // Se actualiza la fecha de modificación de la conversación para ordenar por actividad reciente
        $conversacion->touch();

        return response()->json([
            'id_mensaje' => $mensaje->id_mensaje,
            'contenido' => $mensaje->contenido,
            'es_mio' => true,
            'emisor' => [
                'id_usuario' => $userId,
                'nombre_completo' => Auth::user()->nombre_completo ?? 'Usuario',
            ],
            'leido' => false,
            'created_at' => $mensaje->created_at,
        ], 201);
    }

    /**
     * Obtiene el número total de mensajes no leídos del usuario autenticado.
     *
     * Cuenta todos los mensajes en conversaciones del usuario que fueron enviados
     * por otros participantes y que aún no han sido marcados como leídos.
     * Este endpoint se usa para mostrar el badge de notificaciones en el frontend.
     *
     * @return \Illuminate\Http\JsonResponse Número total de mensajes no leídos.
     */
    public function totalNoLeidos()
    {
        $userId = Auth::id();

        // Se cuentan los mensajes no leídos en todas las conversaciones del usuario
        $total = Mensaje::whereHas('conversacion', function ($q) use ($userId) {
            $q->where('id_usuario_1', $userId)->orWhere('id_usuario_2', $userId);
        })
            ->where('id_emisor', '!=', $userId)
            ->where('leido', false)
            ->count();

        return response()->json(['total' => $total]);
    }
}
