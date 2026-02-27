import { Component, inject } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Componente de Verificación de Autenticación de Dos Factores (2FA)
 *
 * Muestra un formulario para que el usuario introduzca el código de 6 dígitos
 * enviado a su correo electrónico como segundo factor de autenticación.
 *
 * Este componente se activa cuando el login inicial devuelve 'status: 2fa_required'.
 * El email del usuario se recibe como query parameter desde la redirección del login.
 *
 * Tras verificar el código exitosamente, redirige al usuario según su rol:
 * - **Anfitrion**: `/anfitrion/mis-areas`
 * - **Cliente**: `/cliente/panel`
 * - **Otros roles**: `/explorar`
 */
@Component({
    selector: 'app-verify-2fa',
    standalone: true,
    imports: [FormsModule],
    templateUrl: './verify-2fa.component.html'
})
export class Verify2faComponent {
    /** Email del usuario, recibido como query parameter desde la vista de login */
    email: string = '';
    /** Código de verificación de 6 dígitos introducido por el usuario */
    code: string = '';
    /** Mensaje de error si el código es inválido o expirado */
    errorMessage: string = '';
    /** Indicador de estado de carga durante la verificación */
    isLoading: boolean = false;

    private authService = inject(AuthService);
    private router = inject(Router);
    private route = inject(ActivatedRoute);

    /**
     * Extrae el email del query parameter al inicializar el componente.
     * Si no se proporciona email, muestra un mensaje de error.
     */
    ngOnInit() {
        this.email = this.route.snapshot.queryParams['email'] || '';
        if (!this.email) {
            this.errorMessage = 'No se proporcionó email. Vuelve a iniciar sesión.';
        }
    }

    /**
     * Verifica el código 2FA contra el backend.
     * Si la verificación es exitosa, el AuthService almacena el token
     * y se redirige al usuario según su rol.
     */
    verify() {
        if (!this.code || this.code.length < 6) {
            this.errorMessage = 'El código debe tener 6 dígitos';
            return;
        }

        this.isLoading = true;
        this.errorMessage = '';

        this.authService.verify2FA(this.email, this.code).subscribe({
            next: (res) => {
                this.isLoading = false;
                // El servicio de autenticación almacena el token internamente
                const role = this.authService.getRole();
                if (role === 'Anfitrion') {
                    setTimeout(() => this.router.navigate(['/anfitrion/mis-areas']), 500);
                } else if (role === 'Cliente') {
                    setTimeout(() => this.router.navigate(['/cliente/panel']), 500);
                } else {
                    setTimeout(() => this.router.navigate(['/explorar']), 500);
                }
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err.error?.message || 'Código inválido o expirado';
            }
        });
    }
}
