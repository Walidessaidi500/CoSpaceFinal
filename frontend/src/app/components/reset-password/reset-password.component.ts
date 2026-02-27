import { ChangeDetectorRef, Component, inject, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute, RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Restablecimiento de Contraseña (Reset Password)
 *
 * Permite al usuario restablecer su contraseña introduciendo el código de verificación
 * recibido por email y la nueva contraseña. El email se obtiene automáticamente
 * del query parameter si se viene desde la vista de forgot-password.
 *
 * Tras restablecer exitosamente la contraseña, redirige al usuario
 * a la vista de inicio de sesión tras 3 segundos.
 */
@Component({
    selector: 'app-reset-password',
    standalone: true,
    imports: [FormsModule, RouterModule, TranslateModule],
    templateUrl: './reset-password.component.html'
})
export class ResetPasswordComponent {
    /** Email del usuario, pre-rellenado desde el query parameter */
    email: string = '';
    /** Código de verificación recibido por correo electrónico */
    code: string = '';
    /** Nueva contraseña elegida por el usuario */
    password: string = '';
    /** Confirmación de la nueva contraseña */
    password_confirmation: string = '';

    /** Mensaje de éxito tras restablecer la contraseña */
    message: string = '';
    /** Mensaje de error si el restablecimiento falla */
    errorMessage: string = '';
    /** Indicador de estado de carga durante el envío */
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);
    private cdr = inject(ChangeDetectorRef);

    /** Pre-rellena el email si se pasa como query parameter desde forgot-password. */
    ngOnInit() {
        this.email = this.route.snapshot.queryParams['email'] || '';
    }

    /**
     * Envía la solicitud de restablecimiento de contraseña al backend.
     * Valida que las contraseñas coincidan antes de enviar.
     * Tras éxito, redirige al login después de 3 segundos.
     */
    submit() {
        // Se verifica que las contraseñas coincidan antes de enviar
        if (this.password !== this.password_confirmation) {
            this.errorMessage = 'Las contraseñas no coinciden.';
            return;
        }

        this.isLoading = true;
        this.message = '';
        this.errorMessage = '';
        this.cdr.detectChanges();

        this.authService.resetPassword(this.email, this.code, this.password, this.password_confirmation).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.message = 'Contraseña restablecida correctamente. Redirigiendo...';
                this.cdr.detectChanges();
                // Redirección al login tras 3 segundos para que el usuario vea el mensaje de éxito
                setTimeout(() => {
                    this.router.navigate(['/iniciar-sesion']);
                }, 3000);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Error al restablecer contraseña.';
                this.cdr.detectChanges();
            }
        });
    }
}
