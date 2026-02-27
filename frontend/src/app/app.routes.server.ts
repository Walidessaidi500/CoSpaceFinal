import { RenderMode, ServerRoute } from '@angular/ssr';

/**
 * Configuración de rutas del servidor para Server-Side Rendering (SSR).
 *
 * Define cómo Angular debe renderizar cada ruta en el servidor.
 * Con RenderMode.Prerender, todas las rutas se pre-renderizan durante la compilación,
 * generando HTML estático que mejora el tiempo de carga y el posicionamiento SEO.
 */
export const serverRoutes: ServerRoute[] = [
  {
    path: '**',
    renderMode: RenderMode.Prerender
  }
];
