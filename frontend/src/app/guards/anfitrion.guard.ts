import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de protección de rutas para el rol de Anfitrión.
 *
 * Este guard funcional verifica que el usuario autenticado tenga el rol 'Anfitrion'
 * antes de permitir el acceso a las rutas protegidas (crear espacios, gestionar áreas, etc.).
 * Si el usuario no está autenticado o tiene otro rol (Cliente o Admin),
 * se le redirige automáticamente a la página de inicio de sesión.
 */
export const anfitrionGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();
    const role = authService.getRole();

    // Se permite el acceso solo si hay un usuario autenticado con rol de Anfitrión
    if (user && role === 'Anfitrion') {
        return true;
    }

    // Si no cumple las condiciones, se redirige a la página de inicio de sesión
    return router.parseUrl('/iniciar-sesion');
};
