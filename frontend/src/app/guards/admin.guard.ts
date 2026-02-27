import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de protección de rutas para el rol de Admin.
 *
 * Este guard funcional verifica que el usuario autenticado tenga el rol 'Admin'
 * antes de permitir el acceso a las rutas protegidas (panel admin, gestión de espacios, etc.).
 * Si el usuario no está autenticado o tiene otro rol,
 * se le redirige automáticamente a la página de inicio de sesión.
 */
export const adminGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();
    const role = authService.getRole();

    // Se permite el acceso solo si hay un usuario autenticado con rol de Admin
    if (user && role === 'Admin') {
        return true;
    }

    // Si no cumple las condiciones, se redirige a la página de inicio de sesión o home
    // Si ya está logueado como otra cosa, idealmente lo mandas al home
    if (user) {
        return router.parseUrl('/');
    }
    return router.parseUrl('/iniciar-sesion');
};
