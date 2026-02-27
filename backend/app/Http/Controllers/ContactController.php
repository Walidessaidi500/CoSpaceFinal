<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\View;
use Brevo\Brevo;
use Brevo\TransactionalEmails\Requests\SendTransacEmailRequest;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestSender;
use Brevo\TransactionalEmails\Types\SendTransacEmailRequestToItem;

class ContactController extends Controller
{
    public function sendContactEmail(Request $request)
    {
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'email' => 'required|email|max:150',
            'asunto' => 'required|string|max:255',
            'mensaje' => 'required|string',
        ]);

        try {
            $brevo = new Brevo(env('BREVO_API_KEY', ''));

            $htmlContent = "
                <h2>Nuevo Mensaje de Contacto</h2>
                <p><strong>Nombre:</strong> {$validated['nombre']}</p>
                <p><strong>Email:</strong> {$validated['email']}</p>
                <p><strong>Asunto:</strong> {$validated['asunto']}</p>
                <br>
                <p><strong>Mensaje:</strong></p>
                <p>" . nl2br(e($validated['mensaje'])) . "</p>
            ";

            $requestSmtpEmail = new SendTransacEmailRequest([
                'subject' => 'Contacto CoSpace: ' . $validated['asunto'],
                'htmlContent' => $htmlContent,
                'sender' => new SendTransacEmailRequestSender([
                    'name' => env('APP_NAME', 'CoSpace Formulario'),
                    'email' => env('MAIL_FROM_ADDRESS', 'no-reply@cospace.com')
                ]),
                'to' => [
                    // Correo de soporte
                    new SendTransacEmailRequestToItem([
                        'email' => 'hola@cospace.com', // El email donde quieres recibir estos correos
                        'name' => 'Soporte CoSpace'
                    ])
                ],
                'replyTo' => new SendTransacEmailRequestSender([
                    'name' => $validated['nombre'],
                    'email' => $validated['email']
                ])
            ]);

            $brevo->transactionalEmails->sendTransacEmail($requestSmtpEmail);

            return response()->json(['message' => 'Email enviado correctamente'], 200);

        } catch (\Exception $e) {
            Log::error('Error enviando email de contacto: ' . $e->getMessage());
            return response()->json(['error' => 'No se pudo enviar el correo de contacto.'], 500);
        }
    }
}
