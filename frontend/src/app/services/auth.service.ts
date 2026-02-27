
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/enviroments';
import { tap } from 'rxjs/operators';
import { Router } from '@angular/router';

import { BehaviorSubject } from 'rxjs';

/**
 * Servicio de Autenticación (AuthService)
 *
 * Gestiona todo el ciclo de vida de la autenticación del usuario en la plataforma CoSpace.
 * Proporciona métodos para iniciar sesión, cerrar sesión, actualizar el perfil,
 * verificar la autenticación de dos factores (2FA), recuperar y restablecer contraseñas,
 * y cambiar la configuración de seguridad.
 *
 * El estado del usuario se mantiene reactivo mediante un BehaviorSubject, permitiendo
 * que cualquier componente que se suscriba a currentUser$ reciba actualizaciones en tiempo real.
 * Los datos de sesión (token, usuario, rol) se persisten en localStorage.
 */
@Injectable({
    providedIn: 'root'
})
export class AuthService {
    private http = inject(HttpClient);
    private router = inject(Router);
    private apiUrl = environment.apiUrl;

    // BehaviorSubject que mantiene el estado reactivo del usuario actual (null si no hay sesión)
    private currentUserSubject = new BehaviorSubject<any>(this.getUserFromStorage());
    // Observable público al que los componentes pueden suscribirse para recibir actualizaciones del usuario
    currentUser$ = this.currentUserSubject.asObservable();

    constructor() { }

    /**
     * Obtiene los datos del usuario desde localStorage al inicializar el servicio.
     * Verifica que localStorage esté disponible (compatibilidad con SSR).
     */
    private getUserFromStorage() {
        if (typeof localStorage !== 'undefined') {
            const user = localStorage.getItem('user');
            return user ? JSON.parse(user) : null;
        }
        return null;
    }

    /**
     * Inicia sesión del usuario con email y contraseña.
     * Si el login es exitoso, almacena el token, los datos del usuario y el rol en localStorage,
     * y actualiza el BehaviorSubject para notificar a todos los componentes suscritos.
     */
    login(credentials: { email: string, password: string }) {
        return this.http.post<any>(`${this.apiUrl}/login`, credentials).pipe(
            tap(response => {
                if (response.status === 'success') {
                    localStorage.setItem('token', response.data.access_token);
                    localStorage.setItem('user', JSON.stringify(response.data.user));
                    localStorage.setItem('role', response.data.role);
                    this.currentUserSubject.next(response.data.user);
                }
            })
        );
    }

    /**
     * Cierra la sesión del usuario actual.
     * Limpia todos los datos de sesión de localStorage y reinicia el BehaviorSubject a null.
     * Redirige al usuario a la página de inicio de sesión.
     */
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        localStorage.removeItem('role');
        this.currentUserSubject.next(null);
        this.router.navigate(['/iniciar-sesion']);
    }

    /**
     * Obtiene el rol del usuario actual desde localStorage.
     * Posibles valores: 'Cliente', 'Anfitrion', 'Admin' o null si no hay sesión.
     */
    getRole() {
        return localStorage.getItem('role');
    }

    /**
     * Obtiene los datos del usuario actual desde el BehaviorSubject (valor sincrónico).
     */
    getUser() {
        return this.currentUserSubject.value;
    }

    /**
     * Actualiza el perfil del usuario autenticado.
     * Envía los datos del formulario (incluyendo foto de perfil si se seleccionó) al backend.
     * Si la actualización es exitosa, fusiona los datos actualizados con los existentes
     * y actualiza tanto localStorage como el BehaviorSubject.
     */
    updateProfile(formData: FormData) {
        return this.http.post<any>(`${this.apiUrl}/update-profile`, formData).pipe(
            tap(response => {
                if (response.status === 'success' && response.user) {
                    // Se fusionan los datos del usuario actual con los datos actualizados del backend
                    const currentUser = this.getUser();
                    const updatedUser = { ...currentUser, ...response.user };

                    localStorage.setItem('user', JSON.stringify(updatedUser));
                    this.currentUserSubject.next(updatedUser);
                }
            })
        );
    }

    /**
     * Verifica el código de autenticación de dos factores (2FA).
     * Si la verificación es exitosa, establece la sesión completa (token, usuario, rol).
     */
    verify2FA(email: string, code: string) {
        return this.http.post<any>(`${this.apiUrl}/verify-2fa`, { email, code }).pipe(
            tap(response => {
                if (response.status === 'success') {
                    this.setSession(response.data);
                }
            })
        );
    }

    /**
     * Solicita el envío de un código de recuperación de contraseña al correo del usuario.
     */
    forgotPassword(email: string) {
        return this.http.post(`${this.apiUrl}/forgot-password`, { email });
    }

    /**
     * Restablece la contraseña del usuario utilizando el código de verificación recibido por email.
     */
    resetPassword(email: string, code: string, password: string, password_confirmation: string) {
        return this.http.post(`${this.apiUrl}/reset-password`, { email, code, password, password_confirmation });
    }

    /**
     * Activa o desactiva la autenticación de dos factores (2FA) para el usuario actual.
     * Actualiza la información del usuario en localStorage y en el BehaviorSubject
     * para reflejar el cambio en la interfaz de configuración.
     */
    update2FASettings(enabled: boolean) {
        return this.http.post<any>(`${this.apiUrl}/update-2fa-settings`, { enabled }).pipe(
            tap(response => {
                // Se actualiza el campo 2FA del usuario en el almacenamiento local
                const currentUser = this.getUser();
                currentUser.two_factor_enabled = response.enabled ? 1 : 0;
                localStorage.setItem('user', JSON.stringify(currentUser));
                this.currentUserSubject.next(currentUser);
            })
        );
    }

    /**
     * Cambia la contraseña del usuario autenticado.
     * Requiere la contraseña actual y la nueva contraseña con su confirmación.
     */
    changePassword(data: any) {
        return this.http.post<any>(`${this.apiUrl}/change-password`, data);
    }

    /**
     * Establece la sesión completa del usuario en localStorage y en el BehaviorSubject.
     * Se utiliza internamente tras un login exitoso o tras la verificación 2FA.
     */
    private setSession(data: any) {
        localStorage.setItem('token', data.access_token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('role', data.role);
        this.currentUserSubject.next(data.user);
    }
}
