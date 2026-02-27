import { inject } from '@angular/core';
import { Router, type CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de Invitado (GuestGuard)
 * 
 * Este guard protege las rutas para visitantes no autenticados (como Iniciar Sesión o Registrarse).
 * Si un usuario que ya ha iniciado sesión intenta acceder a estas rutas, es interceptado
 * y redirigido directamente a su panel correspondiente según su rol, mejorando la 
 * experiencia de usuario y evitando confusiones.
 * 
 * @returns {boolean} `true` si el usuario NO está autenticado (puede acceder), `false` y redirige si ya lo está.
 */
export const guestGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();
    if (user) {
        // El usuario está logueado, lo redirigimos a su panel
        if (user.tipo_usuario === 'Admin') {
            router.navigate(['/admin/panel']);
        } else if (user.tipo_usuario === 'Anfitrion') {
            router.navigate(['/anfitrion/mis-areas']);
        } else {
            router.navigate(['/cliente/panel']);
        }
        return false;
    }

    // Si no está logueado, le dejamos pasar
    return true;
};
