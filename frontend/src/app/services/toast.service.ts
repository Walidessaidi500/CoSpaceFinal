import { Injectable, signal } from '@angular/core';

/**
 * Interfaz que define la estructura de un mensaje Toast (notificación emergente).
 *
 * @property id Identificador único del toast para poder eliminarlo individualmente.
 * @property message Texto del mensaje a mostrar al usuario.
 * @property type Tipo de toast que determina el estilo visual (color e icono).
 */
export interface ToastMessage {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
}

/**
 * Servicio de Notificaciones Toast (ToastService)
 *
 * Gestiona las notificaciones emergentes (toasts) de la aplicación CoSpace.
 * Proporciona métodos para mostrar mensajes de éxito, error, advertencia e información
 * que se auto-eliminan después de 3.5 segundos. Utiliza un Signal de Angular
 * para mantener la lista reactiva de toasts activos, permitiendo que el componente
 * ToastContainer se actualice automáticamente cuando se añade o elimina un toast.
 */
@Injectable({
    providedIn: 'root'
})
export class ToastService {
    // Signal que mantiene la lista reactiva de toasts activos
    toasts = signal<ToastMessage[]>([]);

    // Contador incremental para generar IDs únicos para cada toast
    private counter = 0;

    /**
     * Muestra un nuevo toast con el mensaje y tipo especificados.
     * Se auto-elimina después de 3.5 segundos mediante setTimeout.
     *
     * @param message Texto del mensaje a mostrar.
     * @param type Tipo de notificación: 'success', 'error', 'info' o 'warning'.
     */
    show(message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') {
        const id = this.counter++;
        const toast: ToastMessage = { id, message, type };
        this.toasts.update(t => [...t, toast]);

        // Se programa la eliminación automática del toast después de 3.5 segundos
        setTimeout(() => {
            this.remove(id);
        }, 3500);
    }

    /** Muestra un toast de tipo éxito (verde). */
    success(message: string) {
        this.show(message, 'success');
    }

    /** Muestra un toast de tipo error (rojo). */
    error(message: string) {
        this.show(message, 'error');
    }

    /** Muestra un toast de tipo advertencia (amarillo). */
    warning(message: string) {
        this.show(message, 'warning');
    }

    /** Muestra un toast de tipo informativo (azul). */
    info(message: string) {
        this.show(message, 'info');
    }

    /**
     * Elimina un toast específico de la lista por su ID.
     *
     * @param id Identificador único del toast a eliminar.
     */
    remove(id: number) {
        this.toasts.update(t => t.filter(toast => toast.id !== id));
    }
}
