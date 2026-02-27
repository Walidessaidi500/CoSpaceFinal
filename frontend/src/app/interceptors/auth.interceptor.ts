import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';

/**
 * Interceptor funcional de autenticación HTTP.
 *
 * Este interceptor se ejecuta en cada petición HTTP saliente de la aplicación.
 * Sus responsabilidades son:
 * 1. Añadir automáticamente el token de autenticación Bearer al encabezado
 *    'Authorization' de todas las peticiones si el usuario está autenticado.
 * 2. Interceptar respuestas con error 401 (no autorizado) para limpiar la sesión
 *    del usuario y redirigirlo a la página de inicio, pero SOLO si el usuario
 *    tenía una sesión activa (token almacenado). Se excluyen las rutas de
 *    autenticación (login, register, etc.) para evitar redirecciones no deseadas.
 *
 * Se verifica que el entorno sea un navegador antes de acceder a localStorage
 * para evitar errores en el renderizado del servidor (SSR).
 */
export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const router = inject(Router);

    // Se verifica si estamos en un entorno de navegador antes de acceder a localStorage (compatibilidad SSR)
    const isBrowser = typeof window !== 'undefined' && typeof window.localStorage !== 'undefined';
    const token = isBrowser ? localStorage.getItem('token') : null;

    let request = req;

    // Si existe un token almacenado, se clona la petición añadiendo el encabezado de autorización
    if (token) {
        request = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`
            }
        });
    }

    return next(request).pipe(
        catchError((error: HttpErrorResponse) => {
            // Solo se limpia la sesión en un 401 si el usuario tenía un token activo
            // y la petición no era de autenticación (login, register, etc.)
            if (error.status === 401 && token) {
                const authPaths = ['/login', '/register', '/verify-2fa', '/forgot-password', '/reset-password'];
                const isAuthRequest = authPaths.some(path => req.url.includes(path));

                if (!isAuthRequest) {
                    if (isBrowser) {
                        localStorage.removeItem('token');
                        localStorage.removeItem('user');
                        localStorage.removeItem('role');
                    }
                    router.navigate(['/iniciar-sesion']);
                }
            }
            return throwError(() => error);
        })
    );
};
