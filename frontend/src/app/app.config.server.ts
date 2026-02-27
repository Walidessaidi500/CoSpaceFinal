import { mergeApplicationConfig, ApplicationConfig } from '@angular/core';
import { provideServerRendering, withRoutes } from '@angular/ssr';
import { appConfig } from './app.config';
import { serverRoutes } from './app.routes.server';

/**
 * Configuración del servidor para Server-Side Rendering (SSR).
 *
 * Combina la configuración base de la aplicación (appConfig) con los proveedores
 * específicos del servidor. Esto permite que Angular renderice las páginas en el
 * servidor antes de enviarlas al navegador, mejorando el SEO y el tiempo de carga inicial.
 */
const serverConfig: ApplicationConfig = {
  providers: [
    provideServerRendering(withRoutes(serverRoutes))
  ]
};

export const config = mergeApplicationConfig(appConfig, serverConfig);
