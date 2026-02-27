<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * Modelo Usuario
 *
 * Representa a un usuario registrado en la plataforma CoSpace.
 * Extiende de Authenticatable para integrarse con el sistema de autenticación de Laravel.
 * Utiliza Laravel Sanctum para la generación de tokens de API (autenticación Bearer).
 *
 * Los usuarios pueden tener tres roles: 'Cliente', 'Anfitrion' o 'Admin'.
 * Según su rol, tendrán acceso a diferentes funcionalidades de la plataforma.
 * El modelo incluye soporte para autenticación de dos factores (2FA) mediante
 * los campos two_factor_enabled, two_factor_code y two_factor_expires_at.
 */
class Usuario extends Authenticatable
{
    use HasFactory, Notifiable, HasApiTokens;

    // Nombre de la tabla en la base de datos
    protected $table = 'usuarios';

    // Clave primaria personalizada de la tabla
    protected $primaryKey = 'id_usuario';

    // Campos permitidos para asignación masiva
    protected $fillable = [
        'nombre_completo',
        'email',
        'password',
        'foto_perfil',
        'tipo_usuario',
        'estado_cuenta',
        'two_factor_enabled',
        'two_factor_code',
        'two_factor_expires_at'
    ];

    /**
     * Campos ocultos en la serialización JSON.
     * La contraseña y el token de recordar sesión nunca se envían al frontend por seguridad.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Conversión automática de tipos de los atributos del modelo.
     * Asegura que la contraseña se hashee automáticamente al asignarla,
     * que las fechas se conviertan a objetos Carbon y que el campo 2FA
     * se trate como booleano nativo de PHP.
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'two_factor_enabled' => 'boolean',
            'two_factor_expires_at' => 'datetime',
        ];
    }

    public function anfitrion()
    {
        return $this->hasOne(Anfitrion::class, 'id_usuario', 'id_usuario');
    }

    public function cliente()
    {
        return $this->hasOne(Cliente::class, 'id_usuario', 'id_usuario');
    }
}
