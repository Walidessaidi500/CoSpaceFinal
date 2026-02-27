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
 *    del usuario (token, datos y rol en localStorage) y redirigirlo a la página
 *    de inicio de sesión.
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
            // Si el servidor responde con 401, el token es inválido o ha expirado
            if (error.status === 401) {
                // Se limpian todos los datos de sesión del almacenamiento local
                if (isBrowser) {
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');
                    localStorage.removeItem('role');
                }
                // Se redirige al usuario a la página de inicio de sesión
                router.navigate(['/iniciar-sesion']);
            }
            return throwError(() => error);
        })
    );
};
