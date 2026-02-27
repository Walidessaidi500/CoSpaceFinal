import { Injectable, signal, effect } from '@angular/core';

/**
 * Servicio de Tema Visual (ThemeService)
 *
 * Gestiona el tema visual de la aplicación CoSpace, incluyendo:
 * - Modo oscuro/claro: alterna entre los temas dark y light.
 * - Tamaño de texto: permite ajustar la escala del texto (accesibilidad).
 *
 * Ambas preferencias se persisten en localStorage y se aplican al elemento
 * raíz del documento (<html>) mediante clases CSS. Al inicializarse, el servicio
 * intenta recuperar las preferencias guardadas del usuario o, en su defecto,
 * detecta la preferencia del sistema operativo para el modo oscuro.
 *
 * Se utilizan Signals de Angular para mantener el estado reactivo, permitiendo
 * que los componentes reaccionen automáticamente a los cambios de tema.
 */
@Injectable({
    providedIn: 'root'
})
export class ThemeService {
    // Signal que mantiene el estado reactivo del modo oscuro (true = oscuro, false = claro)
    darkMode = signal<boolean>(false);

    constructor() {
        this.initializeTheme();
    }

    /**
     * Inicializa el tema visual al arrancar el servicio.
     * 1. Lee la preferencia guardada en localStorage.
     * 2. Si no hay preferencia guardada, detecta la preferencia del sistema operativo.
     * 3. Lee y aplica el tamaño de texto guardado.
     * 4. Aplica ambas configuraciones al DOM.
     */
    private initializeTheme() {
        if (typeof localStorage !== 'undefined') {
            // Se recupera la preferencia de tema guardada en localStorage
            const savedTheme = localStorage.getItem('theme');
            if (savedTheme) {
                this.darkMode.set(savedTheme === 'dark');
            } else {
                // Si no hay preferencia guardada, se usa la preferencia del sistema operativo
                const systemDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                this.darkMode.set(systemDark);
            }

            // Se recupera la preferencia de tamaño de texto guardada
            const savedTextSize = localStorage.getItem('textSize');
            if (savedTextSize) {
                this.textSize.set(savedTextSize);
            }
        }

        // Se aplican las preferencias al DOM
        this.applyTheme(this.darkMode());
        this.applyTextSize(this.textSize());
    }

    /**
     * Alterna entre modo oscuro y modo claro.
     * Invierte el valor actual del Signal y aplica el cambio al DOM.
     */
    toggleDarkMode() {
        this.darkMode.update(val => !val);
        this.applyTheme(this.darkMode());
    }

    /**
     * Establece el modo oscuro a un valor específico.
     *
     * @param isDark true para activar modo oscuro, false para modo claro.
     */
    setDarkMode(isDark: boolean) {
        this.darkMode.set(isDark);
        this.applyTheme(isDark);
    }

    /**
     * Aplica la clase CSS 'dark' al elemento raíz del documento (<html>)
     * y persiste la preferencia en localStorage.
     */
    private applyTheme(isDark: boolean) {
        if (typeof document !== 'undefined') {
            if (isDark) {
                document.documentElement.classList.add('dark');
                localStorage.setItem('theme', 'dark');
            } else {
                document.documentElement.classList.remove('dark');
                localStorage.setItem('theme', 'light');
            }
        }
    }

    // Signal que mantiene la clase CSS actual del tamaño de texto para accesibilidad
    textSize = signal<string>('text-scale-base');

    /**
     * Establece el tamaño de texto de la aplicación.
     * Los valores posibles son: 'text-scale-sm', 'text-scale-base', 'text-scale-lg', 'text-scale-xl'.
     *
     * @param sizeClass Clase CSS del tamaño de texto a aplicar.
     */
    setTextSize(sizeClass: string) {
        this.textSize.set(sizeClass);
        this.applyTextSize(sizeClass);
    }

    /**
     * Aplica la clase de tamaño de texto al elemento raíz del documento.
     * Elimina primero todas las clases de tamaño posibles para evitar conflictos,
     * luego añade la nueva clase y persiste la preferencia en localStorage.
     */
    private applyTextSize(sizeClass: string) {
        if (typeof document !== 'undefined') {
            // Se eliminan todas las clases de tamaño de texto antes de aplicar la nueva
            document.documentElement.classList.remove('text-scale-sm', 'text-scale-base', 'text-scale-lg', 'text-scale-xl');
            document.documentElement.classList.add(sizeClass);
            localStorage.setItem('textSize', sizeClass);
        }
    }
}
