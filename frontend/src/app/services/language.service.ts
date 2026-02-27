import { Injectable, inject, PLATFORM_ID } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { TranslateService } from '@ngx-translate/core';

/**
 * Servicio de Idiomas (LanguageService)
 *
 * Gestiona la internacionalización (i18n) de la aplicación CoSpace.
 * Utiliza @ngx-translate para cargar los archivos de traducción y cambiar
 * el idioma activo de la interfaz. El idioma seleccionado por el usuario
 * se persiste en localStorage para mantener la preferencia entre sesiones.
 *
 * Al inicializarse, el servicio sigue esta prioridad para determinar el idioma:
 * 1. Idioma guardado en localStorage (preferencia del usuario).
 * 2. Idioma del navegador (si está soportado por la aplicación).
 * 3. Español ('es') como idioma por defecto.
 *
 * Para añadir más idiomas, basta con agregar una entrada al array 'availableLanguages'
 * y crear el archivo JSON correspondiente en la carpeta assets/i18n/.
 */
@Injectable({
    providedIn: 'root'
})
export class LanguageService {
    private translate = inject(TranslateService);
    private platformId = inject(PLATFORM_ID);

    // Lista centralizada de idiomas disponibles en la aplicación con su código, etiqueta y bandera
    availableLanguages = [
        { code: 'es', label: 'Español', flag: '🇪🇸' },
        { code: 'va', label: 'Valencià', flag: '🦇' },
        { code: 'en', label: 'English', flag: '🇺🇸' },
    ];

    constructor() {
        // Se registran todos los idiomas disponibles en el servicio de traducción
        this.translate.addLangs(this.availableLanguages.map(l => l.code));
        this.translate.setDefaultLang('es');

        // Se intenta recuperar el idioma guardado en localStorage del usuario
        let savedLang = null;
        if (isPlatformBrowser(this.platformId)) {
            savedLang = localStorage.getItem('language');
        }

        // Se detecta el idioma del navegador como alternativa si no hay idioma guardado
        const browserLang = isPlatformBrowser(this.platformId) ? this.translate.getBrowserLang() : 'es';

        // Prioridad: idioma guardado > idioma del navegador (si es soportado) > español por defecto
        const defaultLang = savedLang || (browserLang && this.availableLanguages.some(l => l.code === browserLang) ? browserLang : 'es');

        this.setLanguage(defaultLang);
    }

    /**
     * Cambia el idioma activo de la aplicación y lo persiste en localStorage.
     *
     * @param lang Código del idioma a establecer (ej: 'es', 'en').
     */
    setLanguage(lang: string) {
        this.translate.use(lang);
        if (isPlatformBrowser(this.platformId)) {
            localStorage.setItem('language', lang);
        }
    }

    /**
     * Obtiene el código del idioma actualmente activo.
     *
     * @returns Código del idioma actual (ej: 'es', 'en').
     */
    getCurrentLanguage() {
        return this.translate.currentLang;
    }
}
