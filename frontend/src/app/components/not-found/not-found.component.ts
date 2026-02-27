import { Component } from '@angular/core';

import { RouterLink } from '@angular/router';

/**
 * Componente de Página No Encontrada (404)
 *
 * Muestra una página de error 404 personalizada cuando el usuario navega
 * a una URL que no existe en la aplicación. Incluye un mensaje explicativo
 * en español y un botón para volver a la página de inicio.
 *
 * Usa un template inline con el diseño completo de la página,
 * posicionado de forma fija para cubrir toda la pantalla.
 */
@Component({
  selector: 'app-not-found',
  standalone: true,
  imports: [RouterLink],
  template: `
    <div class="fixed inset-0 z-[100] overflow-y-auto bg-gray-50 flex flex-col justify-center items-center px-4 sm:px-6 lg:px-8">
      <div class="max-w-md w-full text-center space-y-8">
        <div>
          <h1 class="text-9xl font-extrabold text-primary-blue tracking-widest">404</h1>
          <div class="bg-orange-500 text-white px-2 text-sm rounded rotate-12 absolute shadow-lg relative -top-8 mx-auto w-fit">
            Página no encontrada
          </div>
        </div>
        
        <div class="mt-8">
          <h2 class="mt-6 text-3xl font-bold text-gray-900">Oops! Te has perdido.</h2>
          <p class="mt-2 text-base text-gray-500">
            La página que estás buscando no existe o ha sido movida. Verifica que la URL esté escrita correctamente.
          </p>
        </div>

        <div class="mt-8 flex justify-center">
          <a routerLink="/" 
             class="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-blue hover:bg-opacity-90 transition-colors duration-200">
            <svg class="-ml-1 mr-2 h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Volver al Inicio
          </a>
        </div>
      </div>
    </div>
  `
})
export class NotFoundComponent { }
