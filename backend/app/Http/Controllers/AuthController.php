<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Usuario;
use App\Models\Anfitrion;
use App\Models\Espacio;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use App\Mail\TwoFactorCode;
use App\Mail\ResetPasswordBrevo;
use Carbon\Carbon;
use Brevo\Brevo;
use Brevo\TransactionalEmails\Requests\SendTransacEmailRequest;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestSender;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestToItem;
use Illuminate\Support\Facades\View;

/**
 * Controlador de Autenticación (AuthController)
 *
 * Este controlador gestiona todas las operaciones relacionadas con la autenticación
 * y la gestión de cuentas de usuario en la plataforma CoSpace. Incluye:
 * - Registro de clientes y anfitriones (con creación automática de su primer espacio).
 * - Inicio de sesión con soporte para autenticación de dos factores (2FA).
 * - Actualización del perfil del usuario (nombre, email, foto, teléfono).
 * - Recuperación y restablecimiento de contraseña mediante código enviado por email (Brevo).
 * - Cambio de contraseña y configuración de 2FA.
 */
class AuthController extends Controller
{
    /**
     * Registra un nuevo usuario con rol de Cliente en la plataforma.
     *
     * Valida los datos recibidos, crea el usuario con estado 'Activo' y genera
     * automáticamente un registro en la tabla 'clientes' para cumplir con las
     * restricciones de clave foránea de la base de datos.
     * Se utiliza una transacción para garantizar la integridad de los datos.
     *
     * @param Request $request Datos del formulario de registro (nombre, email, contraseña).
     * @return \Illuminate\Http\JsonResponse Usuario creado o mensaje de error.
     */
    public function registerClient(Request $request)
    {
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:usuarios',
            'password' => 'required|string|min:8',
        ]);

        try {
            DB::beginTransaction();

            $usuario = Usuario::create([
                'nombre_completo' => $validatedData['nombre_completo'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'tipo_usuario' => 'Cliente',
                'estado_cuenta' => 'Activo',
            ]);

            // Se crea el registro en la tabla 'clientes' vinculado al nuevo usuario
            // para satisfacer las restricciones de clave foránea en futuras reservas
            \App\Models\Cliente::firstOrCreate(['id_usuario' => $usuario->id_usuario]);

            DB::commit();

            return response()->json([
                'message' => 'Client registered successfully',
                'user' => $usuario
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Registra un nuevo usuario con rol de Anfitrión junto con su primer espacio.
     *
     * Este método realiza tres operaciones dentro de una transacción:
     * 1. Crea el usuario con tipo 'Anfitrion' y estado 'Pendiente' (requiere aprobación).
     * 2. Crea el registro de Anfitrión con sus datos iniciales.
     * 3. Crea el primer espacio del anfitrión con los datos proporcionados.
     *
     * @param Request $request Datos del formulario de registro con información del usuario y del espacio.
     * @return \Illuminate\Http\JsonResponse Usuario creado o mensaje de error.
     */
    public function register(Request $request)
    {
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|string|email|max:150|unique:usuarios',
            'password' => 'required|string|min:8',
            'titulo' => 'required|string|max:100',
            'ciudad' => 'required|string|max:100',
            'direccion' => 'required|string|max:255',
            'descripcion' => 'required|string',
            'capacidad' => 'required|integer|min:1',
            'precio_hora' => 'required|numeric|min:0',
            'latitud' => 'nullable|numeric',
            'longitud' => 'nullable|numeric',
        ]);

        try {
            DB::beginTransaction();

            // Se crea el usuario con rol de anfitrión y estado pendiente de aprobación
            $usuario = Usuario::create([
                'nombre_completo' => $validatedData['nombre_completo'],
                'email' => $validatedData['email'],
                'password' => Hash::make($validatedData['password']),
                'tipo_usuario' => 'Anfitrion',
                'estado_cuenta' => 'Pendiente',
            ]);

            // Se crea el perfil de anfitrión vinculado al usuario recién registrado
            Anfitrion::create([
                'id_usuario' => $usuario->id_usuario,
                'biografia' => '',
                'es_verificado' => false,
                'cantidad_espacios' => 1,
            ]);

            // Se crea el primer espacio del anfitrión con los datos del formulario de registro
            Espacio::create([
                'id_anfitrion' => $usuario->id_usuario,
                'titulo' => $validatedData['titulo'],
                'ciudad' => $validatedData['ciudad'],
                'direccion' => $validatedData['direccion'],
                'descripcion' => $validatedData['descripcion'],
                'capacidad' => $validatedData['capacidad'],
                'precio_hora' => $validatedData['precio_hora'],
                'latitud' => $validatedData['latitud'] ?? null,
                'longitud' => $validatedData['longitud'] ?? null,
                'estado' => 'Disponible',
            ]);

            DB::commit();

            return response()->json([
                'message' => 'User and Space created successfully',
                'user' => $usuario
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['error' => 'Registration failed: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Inicia sesión de un usuario en la plataforma.
     *
     * Verifica las credenciales del usuario (email y contraseña).
     * Si la cuenta está suspendida, impide el acceso.
     * Si el usuario tiene activada la autenticación de dos factores (2FA),
     * se genera y envía un código de verificación por correo electrónico.
     * En caso contrario, se genera un token de acceso Sanctum y se devuelve al frontend.
     *
     * @param Request $request Credenciales del usuario (email y contraseña).
     * @return \Illuminate\Http\JsonResponse Token de acceso, estado 2FA requerido o mensaje de error.
     */
    public function login(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'password' => 'required',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario || !Hash::check($request->password, $usuario->password)) {
            return response()->json([
                'status' => 'error',
                'message' => 'Credenciales incorrectas.',
            ], 401);
        }

        // Se verifica si la cuenta del usuario ha sido suspendida por un administrador
        if ($usuario->estado_cuenta === 'Suspendido') {
            return response()->json([
                'status' => 'error',
                'message' => 'Su cuenta ha sido suspendida.',
            ], 403);
        }

        // Si el usuario tiene habilitada la autenticación de dos factores, se genera y envía el código
        if ($usuario->two_factor_enabled) {
            $this->generate2FACode($usuario);
            return response()->json([
                'status' => '2fa_required',
                'message' => 'Código de verificación enviado a su correo.',
                'email' => $usuario->email
            ]);
        }

        // Se genera un token de acceso personal mediante Laravel Sanctum
        $token = $usuario->createToken('auth_token')->plainTextToken;

        return response()->json([
            'status' => 'success',
            'message' => 'Inicio de sesión exitoso',
            'data' => [
                'access_token' => $token,
                'token_type' => 'Bearer',
                'user' => $usuario->load(['anfitrion', 'cliente']),
                'role' => $usuario->tipo_usuario
            ]
        ]);
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     *
     * Permite modificar el nombre completo, el correo electrónico y la foto de perfil.
     * Si se sube una nueva foto, se almacena en el disco 'public' dentro de la carpeta 'perfiles'.
     * Si el usuario es de tipo Cliente y envía un teléfono, se actualiza o crea el registro
     * en la tabla 'clientes' mediante updateOrCreate.
     * Se utiliza una transacción para garantizar la consistencia de los datos.
     *
     * @param Request $request Datos del perfil a actualizar.
     * @return \Illuminate\Http\JsonResponse Perfil actualizado o mensaje de error.
     */
    public function updateProfile(Request $request)
    {
        $user = $request->user();

        // Se validan los datos del perfil; la regla unique del email excluye al usuario actual
        $validatedData = $request->validate([
            'nombre_completo' => 'required|string|max:100',
            'email' => 'required|email|max:150|unique:usuarios,email,' . $user->id_usuario . ',id_usuario',
            'foto_perfil' => 'nullable|image|max:5120',
            'telefono' => 'nullable|string|max:20',
            'biografia' => 'nullable|string|max:1000'
        ]);

        try {
            DB::beginTransaction();

            $user->nombre_completo = $validatedData['nombre_completo'];
            $user->email = $validatedData['email'];

            // Si se incluye una nueva foto de perfil, se almacena y se actualiza la ruta en el usuario
            if ($request->hasFile('foto_perfil')) {
                $path = $request->file('foto_perfil')->store('perfiles', 'public');
                $user->foto_perfil = $path;
            }

            // Si se envía un teléfono y el usuario es de tipo Cliente,
            // se actualiza o crea el registro correspondiente en la tabla 'clientes'
            if ($request->has('telefono')) {
                if ($user->tipo_usuario === 'Cliente' || $user->tipo_usuario === 'Anfitrion') {
                    \App\Models\Cliente::updateOrCreate(
                        ['id_usuario' => $user->id_usuario],
                        ['telefono' => $request->telefono]
                    );
                }
            }

            // Si se envía biografia y el usuario es de tipo Anfitrion,
            // se actualiza o crea el registro correspondiente en la tabla 'anfitriones'
            if ($request->has('biografia')) {
                if ($user->tipo_usuario === 'Anfitrion') {
                    \App\Models\Anfitrion::updateOrCreate(
                        ['id_usuario' => $user->id_usuario],
                        ['biografia' => $request->biografia]
                    );
                }
            }

            $user->save();
            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Perfil actualizado correctamente',
                'user' => $user->load(['anfitrion', 'cliente'])
            ]);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error($e->getMessage());
            return response()->json(['status' => 'error', 'message' => 'Error al actualizar perfil'], 500);
        }
    }

    // ==========================================
    // SECCIÓN: Autenticación de Dos Factores (2FA) y Recuperación de Contraseña
    // ==========================================

    /**
     * Genera un código numérico de 6 dígitos para la verificación en dos pasos (2FA).
     *
     * El código se almacena en el usuario junto con una fecha de expiración de 10 minutos.
     * Luego se envía al correo electrónico del usuario utilizando la API de Brevo (SendinBlue)
     * con una plantilla HTML renderizada desde la vista 'emails.two_factor_code'.
     *
     * @param Usuario $usuario Instancia del usuario al que se le envía el código 2FA.
     */
    public function generate2FACode(Usuario $usuario)
    {
        // Se genera un código aleatorio de 6 dígitos y se establece su expiración en 10 minutos
        $code = rand(100000, 999999);
        $usuario->two_factor_code = $code;
        $usuario->two_factor_expires_at = Carbon::now()->addMinutes(10);
        $usuario->save();

        try {
            // Se inicializa el cliente de Brevo con la clave API configurada en el entorno
            $brevo = new Brevo(env('BREVO_API_KEY', ''));

            // Se renderiza la plantilla Blade del correo electrónico con el código de verificación
            $htmlContent = View::make('emails.two_factor_code', ['code' => $code])->render();

            // Se construye la solicitud de envío de correo transaccional con los datos del remitente y destinatario
            $requestSmtpEmail = new SendTransacEmailRequest([
                'subject' => 'Código de Verificación - CoSpace',
                'htmlContent' => $htmlContent,
                'sender' => new SendTransacEmailRequestSender([
                    'name' => env('APP_NAME', 'CoSpace'),
                    'email' => env('MAIL_FROM_ADDRESS', 'no-reply@cospace.com')
                ]),
                'to' => [
                    new SendTransacEmailRequestToItem([
                        'email' => $usuario->email,
                        'name' => $usuario->nombre_completo
                    ])
                ]
            ]);

            // Se envía el correo electrónico a través de la API transaccional de Brevo
            $brevo->transactionalEmails->sendTransacEmail($requestSmtpEmail);
        } catch (\Brevo\Exceptions\BrevoApiException $e) {
            Log::error('Error al enviar email 2FA (API Brevo): ' . $e->getMessage() . ' | Body: ' . json_encode($e->getBody()));
        } catch (\Throwable $e) {
            Log::error('Error al enviar email 2FA: ' . $e->getMessage());
        }
    }

    /**
     * Verifica el código de autenticación de dos factores (2FA) proporcionado por el usuario.
     *
     * Busca al usuario por email, comprueba que la cuenta no esté suspendida,
     * y valida que el código sea correcto y no haya expirado.
     * Si la verificación es exitosa, se genera un token de acceso Sanctum
     * y se limpia el código 2FA del usuario.
     *
     * @param Request $request Email del usuario y código de verificación.
     * @return \Illuminate\Http\JsonResponse Token de acceso o mensaje de error.
     */
    public function verify2FA(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // Se verifica si la cuenta está suspendida antes de permitir el acceso
        if ($usuario->estado_cuenta === 'Suspendido') {
            return response()->json([
                'status' => 'error',
                'message' => 'Su cuenta ha sido suspendida.',
            ], 403);
        }

        // Se compara el código enviado con el almacenado y se verifica que no haya expirado
        if ($usuario->two_factor_code == $request->code && Carbon::now()->lt($usuario->two_factor_expires_at)) {
            // Se limpia el código 2FA para que no pueda ser reutilizado
            $usuario->two_factor_code = null;
            $usuario->two_factor_expires_at = null;
            $usuario->save();

            // Se genera un nuevo token de acceso Sanctum tras la verificación exitosa
            $token = $usuario->createToken('auth_token')->plainTextToken;

            return response()->json([
                'status' => 'success',
                'message' => 'Login exitoso',
                'data' => [
                    'access_token' => $token,
                    'token_type' => 'Bearer',
                    'user' => $usuario->load(['anfitrion', 'cliente']),
                    'role' => $usuario->tipo_usuario
                ]
            ]);
        }

        return response()->json(['message' => 'Código inválido o expirado'], 401);
    }

    /**
     * Envía un código de recuperación de contraseña al correo electrónico del usuario.
     *
     * Si el correo existe en la base de datos, se genera un código de 6 dígitos con
     * una expiración de 15 minutos y se envía mediante la API de Brevo.
     * Por seguridad, siempre se devuelve el mismo mensaje sin importar si el correo existe o no,
     * para evitar la enumeración de cuentas.
     *
     * @param Request $request Email del usuario que solicita la recuperación.
     * @return \Illuminate\Http\JsonResponse Mensaje genérico de confirmación.
     */
    public function forgotPassword(Request $request)
    {
        $request->validate(['email' => 'required|email']);
        $usuario = Usuario::where('email', $request->email)->first();

        // Por seguridad, si el correo no existe no se informa al usuario
        if (!$usuario) {
            return response()->json(['message' => 'Si el correo existe, se ha enviado un código.'], 200);
        }

        // Se genera un código de 6 dígitos con expiración de 15 minutos para la recuperación
        $code = rand(100000, 999999);
        $usuario->two_factor_code = $code;
        $usuario->two_factor_expires_at = Carbon::now()->addMinutes(15);
        $usuario->save();

        try {
            // Se inicializa el cliente de Brevo con la clave API del entorno
            $brevo = new Brevo(env('BREVO_API_KEY', ''));

            // Se renderiza la plantilla Blade del correo de restablecimiento con el código generado
            $htmlContent = View::make('emails.reset_password', ['code' => $code])->render();

            $requestSmtpEmail = new SendTransacEmailRequest([
                'subject' => 'Restablecer Contraseña - CoSpace',
                'htmlContent' => $htmlContent,
                'sender' => new SendTransacEmailRequestSender([
                    'name' => env('APP_NAME', 'CoSpace'),
                    'email' => env('MAIL_FROM_ADDRESS', 'no-reply@cospace.com')
                ]),
                'to' => [
                    new SendTransacEmailRequestToItem([
                        'email' => $usuario->email,
                        'name' => $usuario->nombre_completo
                    ])
                ]
            ]);

            // Se envía el correo de recuperación a través de la API transaccional de Brevo
            $brevo->transactionalEmails->sendTransacEmail($requestSmtpEmail);
        } catch (\Brevo\Exceptions\BrevoApiException $e) {
            Log::error('Error al enviar email de recuperación (API Brevo): ' . $e->getMessage() . ' | Body: ' . json_encode($e->getBody()));
        } catch (\Throwable $e) {
            Log::error('Error al enviar email de recuperación: ' . $e->getMessage());
        }

        return response()->json(['message' => 'Si el correo existe, se ha enviado un código.'], 200);
    }

    /**
     * Restablece la contraseña del usuario mediante el código de recuperación.
     *
     * Verifica que el código proporcionado coincida con el almacenado en la base de datos
     * y que no haya expirado. Si es válido, se actualiza la contraseña del usuario
     * con el nuevo valor hasheado y se limpia el código de recuperación.
     *
     * @param Request $request Email, código de verificación, nueva contraseña y su confirmación.
     * @return \Illuminate\Http\JsonResponse Mensaje de éxito o error.
     */
    public function resetPassword(Request $request)
    {
        $request->validate([
            'email' => 'required|email',
            'code' => 'required|string',
            'password' => 'required|string|min:8|confirmed'
        ]);

        $usuario = Usuario::where('email', $request->email)->first();

        if (!$usuario) {
            return response()->json(['message' => 'Error al restablecer contraseña'], 400);
        }

        // Se valida que el código sea correcto y no haya expirado antes de permitir el cambio
        if ($usuario->two_factor_code === $request->code && Carbon::now()->lt($usuario->two_factor_expires_at)) {
            $usuario->password = Hash::make($request->password);
            $usuario->two_factor_code = null;
            $usuario->two_factor_expires_at = null;
            $usuario->save();

            return response()->json(['message' => 'Contraseña restablecida correctamente'], 200);
        }

        return response()->json(['message' => 'Código inválido o expirado'], 400);
    }

    /**
     * Activa o desactiva la autenticación de dos factores (2FA) para el usuario autenticado.
     *
     * El usuario envía un valor booleano ('enabled') que indica si desea activar o desactivar
     * la verificación en dos pasos para futuros inicios de sesión.
     *
     * @param Request $request Contiene el campo 'enabled' (true/false).
     * @return \Illuminate\Http\JsonResponse Estado actualizado de la configuración 2FA.
     */
    public function update2FASettings(Request $request)
    {
        $user = $request->user();
        $request->validate(['enabled' => 'required|boolean']);

        $user->two_factor_enabled = $request->enabled;
        $user->save();

        return response()->json(['message' => 'Configuración de 2FA actualizada', 'enabled' => $user->two_factor_enabled]);
    }

    /**
     * Cambia la contraseña del usuario autenticado.
     *
     * Requiere la contraseña actual para verificar la identidad del usuario antes
     * de permitir el cambio. La nueva contraseña debe tener al menos 8 caracteres
     * y debe ser confirmada (campo 'new_password_confirmation').
     *
     * @param Request $request Contraseña actual, nueva contraseña y su confirmación.
     * @return \Illuminate\Http\JsonResponse Mensaje de éxito o error.
     */
    public function changePassword(Request $request)
    {
        $user = $request->user();
        $request->validate([
            'current_password' => 'required',
            'new_password' => 'required|string|min:8|confirmed'
        ]);

        // Se verifica que la contraseña actual proporcionada sea correcta
        if (!Hash::check($request->current_password, $user->password)) {
            return response()->json(['message' => 'La contraseña actual no es correcta.'], 400);
        }

        // Se actualiza la contraseña con el nuevo valor hasheado de forma segura
        $user->password = Hash::make($request->new_password);
        $user->save();

        return response()->json(['message' => 'Contraseña actualizada correctamente.']);
    }

}
