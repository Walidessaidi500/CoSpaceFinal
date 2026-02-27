<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Espacio;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\Auth;

/**
 * Controlador de Espacios (EspacioController)
 *
 * Este controlador gestiona todas las operaciones CRUD relacionadas con los espacios
 * de coworking en la plataforma CoSpace. Proporciona endpoints tanto públicos (para
 * que cualquier visitante pueda ver los espacios disponibles) como privados (para que
 * los anfitriones gestionen sus propios espacios).
 *
 * Funcionalidades principales:
 * - Listado público de todos los espacios con sus fotos y servicios.
 * - Listado privado de los espacios de un anfitrión autenticado.
 * - Creación de nuevos espacios con fotos y servicios asociados.
 * - Visualización de un espacio individual con todos sus detalles.
 * - Actualización de datos, servicios y fotos de un espacio existente.
 * - Eliminación de espacios verificando la propiedad del anfitrión.
 */
class EspacioController extends Controller
{
    /**
     * Obtiene la lista pública de todos los espacios registrados en la plataforma.
     *
     * Este endpoint es accesible sin autenticación y carga las relaciones de fotos
     * y servicios de cada espacio para que el frontend pueda mostrar toda la información
     * necesaria en las tarjetas de exploración.
     *
     * @return \Illuminate\Http\JsonResponse Lista completa de espacios con fotos y servicios.
     */
    public function index()
    {
        try {
            // Se obtienen todos los espacios con sus fotos y servicios cargados (eager loading)
            $espacios = Espacio::with(['fotos', 'servicios'])->get();
            return response()->json($espacios);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtiene la lista de espacios que pertenecen al anfitrión autenticado.
     *
     * Solo devuelve los espacios creados por el anfitrión que ha iniciado sesión,
     * permitiéndole gestionar sus propios espacios desde su panel.
     * Los resultados se ordenan del más reciente al más antiguo.
     *
     * @return \Illuminate\Http\JsonResponse Lista de espacios del anfitrión autenticado.
     */
    public function indexAnfitrion()
    {
        $anfitrionId = Auth::id();

        try {
            // Se filtran los espacios por el ID del anfitrión autenticado y se cargan sus relaciones
            $espacios = Espacio::where('id_anfitrion', $anfitrionId)
                ->with(['fotos', 'servicios'])
                ->orderBy('created_at', 'desc')
                ->get();

            return response()->json($espacios);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage(), 'file' => $e->getFile(), 'line' => $e->getLine()], 500);
        }
    }

    /**
     * Crea un nuevo espacio de coworking en la plataforma.
     *
     * Valida todos los datos del formulario: título, ciudad, dirección, descripción,
     * precio por hora, capacidad, servicios opcionales, fotos (mínimo 3) y coordenadas.
     * La operación se ejecuta dentro de una transacción para garantizar la integridad:
     * 1. Se crea el espacio con sus datos básicos.
     * 2. Se asocian los servicios seleccionados mediante la tabla pivote.
     * 3. Se almacenan las fotos en el disco 'public' y se registran en la base de datos.
     * La primera foto subida se marca automáticamente como foto principal.
     *
     * @param Request $request Datos del formulario de creación del espacio.
     * @return \Illuminate\Http\JsonResponse Espacio creado con sus relaciones o mensaje de error.
     */
    public function store(Request $request)
    {
        // Se convierten valores vacíos de latitud y longitud a null antes de validar
        // y se normaliza el formato del precio (coma decimal → punto decimal)
        $request->merge([
            'latitud' => $request->input('latitud') !== '' ? $request->input('latitud') : null,
            'longitud' => $request->input('longitud') !== '' ? $request->input('longitud') : null,
            'precio_hora' => $request->input('precio_hora') ? str_replace(',', '.', $request->input('precio_hora')) : $request->input('precio_hora'),
        ]);

        $validator = Validator::make($request->all(), [
            'titulo' => 'required|string|max:100',
            'ciudad' => 'required|string|max:100',
            'direccion' => 'required|string|max:255',
            'descripcion' => 'required|string|min:20',
            'precio_hora' => 'required|numeric|min:0',
            'capacidad' => 'required|integer|min:1',
            'servicios' => 'array',
            'servicios.*' => 'integer|exists:servicios,id_servicio',
            'fotos' => 'array|min:3',
            'fotos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            return DB::transaction(function () use ($request) {

                // Se obtiene el ID del anfitrión autenticado mediante Sanctum
                $anfitrionId = Auth::id();

                if (!$anfitrionId) {
                    return response()->json(['message' => 'Unauthenticated'], 401);
                }

                // Se crea el espacio con los valores iniciales de rating y reseñas en 0
                $espacio = Espacio::create([
                    'id_anfitrion' => $anfitrionId,
                    'titulo' => $request->titulo,
                    'ciudad' => $request->ciudad,
                    'direccion' => $request->direccion,
                    'descripcion' => $request->descripcion,
                    'precio_hora' => $request->precio_hora,
                    'capacidad' => $request->capacidad,
                    'estado' => 'Disponible',
                    'rating_promedio' => 0.00,
                    'total_resenas' => 0,
                    'latitud' => $request->latitud,
                    'longitud' => $request->longitud
                ]);

                // Se asocian los servicios seleccionados al espacio mediante la tabla pivote
                if ($request->has('servicios') && !empty($request->servicios)) {
                    $espacio->servicios()->attach($request->servicios);
                }

                // Se almacenan las fotos en el disco 'public' y se registra cada una en la base de datos
                // La primera foto (índice 0) se marca como foto principal del espacio
                if ($request->hasFile('fotos')) {
                    foreach ($request->file('fotos') as $index => $foto) {
                        $mimeType = $foto->getClientMimeType();
                        $base64 = base64_encode(file_get_contents($foto->path()));

                        \App\Models\FotoEspacio::create([
                            'id_espacio' => $espacio->id_espacio,
                            'url_foto' => 'data:' . $mimeType . ';base64,' . $base64,
                            'es_principal' => $index === 0
                        ]);
                    }
                }

                return response()->json([
                    'message' => 'Espacio creado exitosamente',
                    'data' => $espacio->load(['servicios', 'fotos'])
                ], 201);
            });

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al guardar en la base de datos',
                'error' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtiene los detalles completos de un espacio específico.
     *
     * Carga todas las relaciones necesarias: fotos, servicios y datos del anfitrión
     * (incluyendo la información del usuario asociado al anfitrión).
     * Este endpoint es público y se utiliza para la página de detalles del espacio.
     *
     * @param int $id Identificador único del espacio.
     * @return \Illuminate\Http\JsonResponse Datos completos del espacio o error 404.
     */
    public function show($id)
    {
        try {
            // Se busca el espacio con todas sus relaciones cargadas para la vista de detalle
            $espacio = Espacio::with(['fotos', 'servicios', 'anfitrion.usuario'])->find($id);
            if (!$espacio) {
                return response()->json(['message' => 'Espacio no encontrado'], 404);
            }
            return response()->json($espacio);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Obtiene el perfil público de un anfitrión y sus espacios disponibles.
     * 
     * @param int $id Identificador único del anfitrión.
     * @return \Illuminate\Http\JsonResponse Datos del anfitrión y sus espacios, o error 404.
     */
    public function showAnfitrion($id)
    {
        try {
            $usuario = \App\Models\Usuario::find($id);
            if (!$usuario || $usuario->tipo_usuario !== 'Anfitrion') {
                return response()->json(['message' => 'El perfil solicitado no es de un anfitrión registrado'], 404);
            }

            $anfitrion = \App\Models\Anfitrion::find($id);
            $espacios = \App\Models\Espacio::with(['fotos', 'servicios'])
                ->where('id_anfitrion', $id)
                ->get();

            return response()->json([
                'id_usuario' => $usuario->id_usuario,
                'usuario' => $usuario,
                'biografia' => $anfitrion ? $anfitrion->biografia : 'Este anfitrión no ha proporcionado una biografía.',
                'es_verificado' => $anfitrion ? $anfitrion->es_verificado : false,
                'cantidad_espacios' => $espacios->count(),
                'espacios' => $espacios,
            ]);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Elimina un espacio propiedad del anfitrión autenticado.
     *
     * Verifica que el espacio exista y que pertenezca al anfitrión que hace la solicitud.
     * Si el anfitrión no es el propietario del espacio, se devuelve un error 404 por seguridad
     * (no se revela si el espacio existe pero pertenece a otro usuario).
     *
     * @param int $id Identificador único del espacio a eliminar.
     * @return \Illuminate\Http\JsonResponse Mensaje de confirmación o error.
     */
    public function destroy($id)
    {
        $anfitrionId = Auth::id();

        if (!$anfitrionId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Se busca el espacio verificando que pertenezca al anfitrión autenticado
        $espacio = Espacio::where('id_espacio', $id)
            ->where('id_anfitrion', $anfitrionId)
            ->first();

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado o no autorizado'], 404);
        }

        $espacio->delete();

        return response()->json(['message' => 'Espacio eliminado correctamente']);
    }

    /**
     * Actualiza los datos de un espacio propiedad del anfitrión autenticado.
     *
     * Verifica la propiedad del espacio antes de permitir la actualización.
     * Los campos son opcionales gracias a la regla 'sometimes', permitiendo
     * actualizar solo los campos enviados. Se pueden actualizar también los
     * servicios (mediante sincronización en la tabla pivote) y añadir nuevas
     * fotos al espacio. Todo se ejecuta dentro de una transacción.
     *
     * @param Request $request Datos a actualizar del espacio.
     * @param int $id Identificador único del espacio a actualizar.
     * @return \Illuminate\Http\JsonResponse Espacio actualizado o mensaje de error.
     */
    public function update(Request $request, $id)
    {
        $anfitrionId = Auth::id();

        if (!$anfitrionId) {
            return response()->json(['message' => 'Unauthenticated'], 401);
        }

        // Se verifica que el espacio pertenezca al anfitrión autenticado
        $espacio = Espacio::where('id_espacio', $id)
            ->where('id_anfitrion', $anfitrionId)
            ->first();

        if (!$espacio) {
            return response()->json(['message' => 'Espacio no encontrado o no autorizado'], 404);
        }

        // Se convierten valores vacíos de latitud y longitud a null antes de validar
        // y se normaliza el formato del precio (coma decimal → punto decimal)
        $request->merge([
            'latitud' => $request->input('latitud') !== '' ? $request->input('latitud') : null,
            'longitud' => $request->input('longitud') !== '' ? $request->input('longitud') : null,
            'precio_hora' => $request->input('precio_hora') ? str_replace(',', '.', $request->input('precio_hora')) : $request->input('precio_hora'),
        ]);

        // Se validan los datos; 'sometimes' permite actualizar solo los campos enviados en la petición
        $validator = Validator::make($request->all(), [
            'titulo' => 'sometimes|required|string|max:100',
            'ciudad' => 'sometimes|required|string|max:100',
            'direccion' => 'sometimes|required|string|max:255',
            'descripcion' => 'sometimes|required|string|min:20',
            'precio_hora' => 'sometimes|required|numeric|min:0',
            'capacidad' => 'sometimes|required|integer|min:1',
            'servicios' => 'array',
            'servicios.*' => 'integer|exists:servicios,id_servicio',
            'latitud' => 'sometimes|nullable|numeric',
            'longitud' => 'sometimes|nullable|numeric',
            'fotos' => 'sometimes|array',
            'fotos.*' => 'image|mimes:jpeg,png,jpg|max:5120',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'message' => 'Datos inválidos',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::transaction(function () use ($request, $espacio) {
                // Se actualizan solo los campos permitidos que fueron enviados en la petición
                $espacio->update($request->only([
                    'titulo',
                    'ciudad',
                    'direccion',
                    'descripcion',
                    'precio_hora',
                    'capacidad',
                    'latitud',
                    'longitud'
                ]));

                // Si se enviaron servicios, se sincronizan con la tabla pivote (reemplaza los anteriores)
                if ($request->has('servicios')) {
                    $espacio->servicios()->sync($request->servicios);
                }

                // Si se enviaron nuevas fotos, se almacenan y registran como fotos adicionales del espacio
                if ($request->hasFile('fotos')) {
                    foreach ($request->file('fotos') as $foto) {
                        $mimeType = $foto->getClientMimeType();
                        $base64 = base64_encode(file_get_contents($foto->path()));

                        \App\Models\FotoEspacio::create([
                            'id_espacio' => $espacio->id_espacio,
                            'url_foto' => 'data:' . $mimeType . ';base64,' . $base64,
                            'es_principal' => false
                        ]);
                    }
                }
            });

            return response()->json([
                'message' => 'Espacio actualizado exitosamente',
                'data' => $espacio->load(['servicios', 'fotos'])
            ]);

        } catch (\Exception $e) {
            return response()->json([
                'message' => 'Error al actualizar el espacio',
                'error' => $e->getMessage()
            ], 500);
        }
    }
}
