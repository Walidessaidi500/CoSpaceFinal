<?php

namespace App\Mail;

use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

/**
 * Clase de correo para el envío del código de verificación de dos factores (2FA).
 *
 * Este Mailable genera el correo electrónico que se envía al usuario durante
 * el proceso de inicio de sesión cuando tiene habilitada la autenticación
 * de dos factores. Contiene un código numérico de 6 dígitos con validez
 * de 10 minutos que el usuario debe introducir para completar el login.
 * Utiliza la plantilla Blade 'emails.two_factor_code' para renderizar el contenido HTML.
 */
class TwoFactorCode extends Mailable
{
    use Queueable, SerializesModels;

    // Código de verificación 2FA de 6 dígitos que se envía al usuario
    public $code;

    /**
     * Constructor del Mailable.
     * Recibe el código de verificación generado en el controlador de autenticación.
     *
     * @param string|int $code Código numérico de 6 dígitos para la verificación 2FA.
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
            subject: 'Código de Verificación - CoSpace',
        );
    }

    /**
     * Define el contenido del correo electrónico.
     * Utiliza la vista Blade 'emails.two_factor_code' que recibe la variable $code.
     *
     * @return Content Configuración del contenido con la vista a renderizar.
     */
    public function content(): Content
    {
        return new Content(
            view: 'emails.two_factor_code',
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
