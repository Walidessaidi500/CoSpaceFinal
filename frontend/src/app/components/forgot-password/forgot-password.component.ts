import { ChangeDetectorRef, Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Recuperación de Contraseña (Forgot Password)
 *
 * Permite al usuario solicitar un código de recuperación de contraseña
 * introduciendo su dirección de correo electrónico. El backend envía
 * un código de verificación al email proporcionado a través de Brevo.
 *
 * Por motivos de seguridad, siempre se muestra un mensaje genérico
 * independientemente de si el email existe o no en el sistema.
 */
@Component({
    selector: 'app-forgot-password',
    standalone: true,
    imports: [FormsModule, RouterModule, TranslateModule],
    templateUrl: './forgot-password.component.html'
})
export class ForgotPasswordComponent {
    /** Email introducido por el usuario para la recuperación */
    email: string = '';
    /** Mensaje de éxito tras enviar la solicitud de recuperación */
    message: string = '';
    /** Mensaje de error si la solicitud falla */
    errorMessage: string = '';
    /** Indicador de estado de carga durante el envío */
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private cdr = inject(ChangeDetectorRef);

    /**
     * Envía la solicitud de recuperación de contraseña al backend.
     * Muestra siempre un mensaje genérico para no revelar si el email existe.
     */
    submit() {
        if (!this.email) return;

        this.isLoading = true;
        this.message = '';
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.authService.forgotPassword(this.email).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                // Se muestra un mensaje genérico por seguridad o el mensaje del backend
                this.message = res.message || 'Si el correo existe, recibirás un código.';
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'Ocurrió un error. Inténtalo de nuevo.';
                this.cdr.detectChanges();
            }
        });
    }
}
