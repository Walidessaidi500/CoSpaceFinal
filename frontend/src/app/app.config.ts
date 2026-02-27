import { ApplicationConfig } from '@angular/core';
import { provideRouter } from '@angular/router';
import { HttpClient, provideHttpClient, withInterceptors } from '@angular/common/http';
import { TranslateLoader, TranslateModule, provideTranslateService } from '@ngx-translate/core';
import { provideTranslateHttpLoader } from '@ngx-translate/http-loader';
import { importProvidersFrom } from '@angular/core';
import { routes } from './app.routes';
import { authInterceptor } from './interceptors/auth.interceptor';
import { provideNgxStripe } from 'ngx-stripe';
import { environment } from '../environments/enviroments';

/**
 * Configuración principal de la aplicación Angular (AppConfig).
 *
 * Define todos los proveedores globales necesarios para la aplicación:
 * - Router: sistema de navegación con las rutas definidas en app.routes.ts.
 * - HttpClient: cliente HTTP con el interceptor de autenticación que añade el token Bearer.
 * - NgxStripe: integración con Stripe para el procesamiento de pagos con la clave pública.
 * - TranslateService: servicio de internacionalización (i18n) con español como idioma por defecto.
 * - TranslateHttpLoader: carga los archivos de traducción desde la carpeta assets/i18n/.
 */
export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes),
    provideHttpClient(withInterceptors([authInterceptor])),
    provideNgxStripe(environment.stripePublicKey),
    provideTranslateService({
      fallbackLang: 'es'
    }),
    provideTranslateHttpLoader({
      prefix: '/assets/i18n/',
      suffix: '.json'
    }),
    importProvidersFrom(
      TranslateModule
    )
  ]
};