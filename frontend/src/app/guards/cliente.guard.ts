import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';

/**
 * Guard de protección de rutas para el rol de Cliente.
 *
 * Este guard funcional verifica que el usuario autenticado tenga el rol 'Cliente'
 * antes de permitir el acceso a las rutas protegidas (panel cliente, etc.).
 * Si el usuario no está autenticado o tiene otro rol,
 * se le redirige automáticamente a la página de inicio o login.
 */
export const clienteGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    const user = authService.getUser();
    const role = authService.getRole();

    // Se permite el acceso solo si hay un usuario autenticado con rol de Cliente
    if (user && role === 'Cliente') {
        return true;
    }

    if (user) {
        return router.parseUrl('/');
    }
    return router.parseUrl('/iniciar-sesion');
};
