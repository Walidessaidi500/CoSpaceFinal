import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../../services/toast.service';

/**
 * Componente Contenedor de Notificaciones Toast
 *
 * Renderiza todas las notificaciones toast activas en la esquina superior derecha
 * de la pantalla. Utiliza Signals del ToastService para obtener la lista
 * reactiva de toasts y mostrar cada uno según su tipo (success, error, warning, info).
 *
 * Los toasts se apilan verticalmente con una separación de 12px y cada uno
 * incluye un icono SVG correspondiente a su tipo, el mensaje y un botón de cierre.
 * Se aplican animaciones de entrada (animate-bounce-in-up) para una experiencia visual fluida.
 *
 * Soporta modo oscuro mediante clases condicionales dark:.
 */
@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed top-24 right-8 z-100 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      @for (toast of toastService.toasts(); track toast) {
        <div
          class="pointer-events-auto transform transition-all duration-300 ease-out animate-bounce-in-up flex items-start w-full max-w-xs p-4 rounded-xl shadow-lg border relative overflow-hidden"
           [ngClass]="{
             'bg-white dark:bg-[#1a2736] border-green-200 dark:border-green-800/30': toast.type === 'success',
             'bg-white dark:bg-[#1a2736] border-red-200 dark:border-red-800/30': toast.type === 'error',
             'bg-white dark:bg-[#1a2736] border-yellow-200 dark:border-yellow-800/30': toast.type === 'warning',
             'bg-white dark:bg-[#1a2736] border-blue-200 dark:border-blue-800/30': toast.type === 'info'
           }">
          <!-- Icono según el tipo de notificación -->
          <div class="shrink-0 mt-0.5">
            @if (toast.type === 'success') {
              <svg class="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            }
            @if (toast.type === 'error') {
              <svg class="w-5 h-5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            }
            @if (toast.type === 'warning') {
              <svg class="w-5 h-5 text-yellow-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path>
              </svg>
            }
            @if (toast.type === 'info') {
              <svg class="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
              </svg>
            }
          </div>
          <div class="ml-3 w-0 flex-1">
            <p class="text-[14px] font-medium text-primary-blue dark:text-white">
              {{ toast.message }}
            </p>
          </div>
          <!-- Botón para cerrar la notificación manualmente -->
          <div class="ml-4 shrink-0 flex">
            <button (click)="toastService.remove(toast.id)" class="inline-flex text-neutral-placeholder dark:text-gray-400 hover:text-primary-blue dark:hover:text-gray-200 transition-colors">
              <span class="sr-only">Close</span>
              <svg class="h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        </div>
      }
    </div>
    `
})
export class ToastContainerComponent {
  /** Servicio de notificaciones toast inyectado para acceder a la lista de toasts activos */
  toastService = inject(ToastService);
}
