import { Component, inject, ChangeDetectorRef } from '@angular/core';
import { RouterLink, Router } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';


import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente del Formulario de Inicio de Sesión (Login Form)
 *
 * Gestiona el proceso de autenticación del usuario, incluyendo:
 *
 * 1. **Validación del formulario**: Email y contraseña obligatorios.
 * 2. **Autenticación normal**: Envío de credenciales al backend y redirección según rol.
 * 3. **Soporte para 2FA**: Si el backend responde con 'status: 2fa_required',
 *    redirige al componente de verificación 2FA pasando el email como parámetro.
 * 4. **Cuenta suspendida**: Si el backend devuelve un error 403 con mensaje de suspensión,
 *    muestra una vista especial informando al usuario.
 *
 * La redirección tras login exitoso varía según el rol del usuario:
 * - **Anfitrion**: `/anfitrion/mis-areas` (con delay de 1.5s para mejor UX)
 * - **Cliente**: `/cliente/panel`
 * - **Otros roles**: `/explorar`
 */
@Component({
    selector: 'app-login-form',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, TranslateModule],
    templateUrl: './login-form.component.html',
})
export class LoginFormComponent {
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);

    /** Formulario reactivo con validaciones de email y contraseña */
    form = this.fb.group({
        email: ['', [Validators.required, Validators.email]],
        password: ['', [Validators.required]]
    });

    constructor() {
    }

    /** Mensaje de error mostrado al usuario en caso de fallo de autenticación */
    errorMessage: string = '';
    /** Mensaje de éxito mostrado brevemente tras un login correcto */
    successMessage: string = '';
    /** Indicador de estado de carga durante la petición de login */
    isLoading: boolean = false;
    /** Indica si la cuenta del usuario está suspendida (error 403) */
    isSuspended: boolean = false;

    /**
     * Envía las credenciales al backend para autenticación.
     *
     * Flujo de ejecución:
     * 1. Valida que el formulario sea correcto.
     * 2. Envía las credenciales al servicio de autenticación.
     * 3. Si requiere 2FA, redirige a la vista de verificación.
     * 4. Si el login es exitoso, redirige según el rol del usuario.
     * 5. Si la cuenta está suspendida (403), muestra la vista de cuenta suspendida.
     * 6. Si hay otro error, muestra el mensaje de error correspondiente.
     */
    onSubmit() {
        console.log('Login Submit Triggered');
        this.errorMessage = '';
        this.successMessage = '';

        console.log('Form Status:', this.form.status);
        console.log('Form Value:', this.form.value);

        if (this.form.invalid) {
            console.log('Form is invalid, marking as touched');
            this.form.markAllAsTouched();
            return;
        }

        this.isLoading = true;

        const credentials = {
            email: this.form.get('email')?.value ?? '',
            password: this.form.get('password')?.value ?? ''
        };

        this.authService.login(credentials).subscribe({
            next: (res) => {
                // Si el backend indica que se requiere verificación 2FA
                if (res.status === '2fa_required') {
                    this.router.navigate(['/verify-2fa'], { queryParams: { email: res.email } });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                    return;
                }

                // Login exitoso: redirección según el rol del usuario
                const role = res.data.role;
                this.successMessage = `Login exitoso como ${role}.`;
                this.cdr.detectChanges();

                if (role === 'Anfitrion') {
                    // Delay mayor para anfitriones para dar tiempo a ver el mensaje de éxito
                    setTimeout(() => {
                        this.router.navigate(['/anfitrion/mis-areas']).catch(() => {
                        });
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }, 1500);
                } else if (role === 'Cliente') {
                    setTimeout(() => {
                        this.router.navigate(['/cliente/panel']);
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }, 500);
                } else {
                    setTimeout(() => {
                        this.router.navigate(['/explorar']);
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }, 500);
                }
            },
            error: (err) => {
                console.error('Error during login:', err);

                const errorMsg = err.error?.message || '';

                // Si el error es 403 y el mensaje indica cuenta suspendida, se muestra vista especial
                if (err.status === 403 && errorMsg.toLowerCase().includes('suspendida')) {
                    console.log('Account is suspended. Triggering isSuspended view.');
                    this.isSuspended = true;
                } else {
                    this.errorMessage = errorMsg || 'Error al iniciar sesión. Verifique sus credenciales.';
                }

                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
