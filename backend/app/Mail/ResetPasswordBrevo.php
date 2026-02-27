<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Clase de correo para el restablecimiento de contraseña mediante Brevo.
 *
 * Este Mailable genera el correo electrónico que se envía al usuario cuando
 * solicita restablecer su contraseña. Contiene un código numérico de 6 dígitos
 * que el usuario debe introducir en el formulario de restablecimiento.
 * Utiliza la plantilla Blade 'emails.reset_password' para renderizar el contenido HTML.
 */
class ResetPasswordBrevo extends Mailable
{
    use Queueable, SerializesModels;

    // Código de verificación de 6 dígitos que se envía al usuario por correo
    public $code;

    /**
     * Constructor del Mailable.
     * Recibe el código de restablecimiento generado en el controlador de autenticación.
     *
     * @param string|int $code Código numérico de 6 dígitos para restablecer la contraseña.
     */
    public function __construct($code)
    {
        $this->code = $code;
    }

    /**
     * Define el sobre del correo electrónico (asunto y metadatos).
     *
     * @return Envelope Configuración del sobre con el asunto del correo.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: 'Restablecer Contraseña - CoSpace',
        );
    }

    /**
     * Define el contenido del correo electrónico.
     * Utiliza la vista Blade 'emails.reset_password' que recibe la variable $code.
     *
     * @return Content Configuración del contenido con la vista a renderizar.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.reset_password',
        );
    }

    /**
     * Define los archivos adjuntos del correo electrónico.
     * Este correo no incluye archivos adjuntos.
     *
     * @return array Lista vacía de adjuntos.
     */
    public function attachments(): array
    {
        return [];
    }
}
