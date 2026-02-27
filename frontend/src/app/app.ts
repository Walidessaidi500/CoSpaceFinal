import { Component, inject, OnInit } from '@angular/core';
import { ApiService } from './services/api';
import { ThemeService } from './services/theme.service';
import { RouterOutlet } from '@angular/router';
import { HeaderComponent } from './components/header/header.component';
import { FooterComponent } from './components/footer/footer.component';
import { ToastContainerComponent } from './components/shared/toast-container/toast-container.component';
import { LanguageService } from './services/language.service';
import { ToastService } from './services/toast.service';
import { ChatWidgetComponent } from './components/chat-widget/chat-widget.component';

/**
 * Componente raíz de la aplicación CoSpace.
 *
 * Este es el componente principal que actúa como contenedor de toda la aplicación.
 * Incluye el Header (cabecera de navegación), el RouterOutlet (donde se renderizan
 * los componentes de cada ruta), el Footer (pie de página), el contenedor de
 * notificaciones Toast y el widget de chat.
 *
 * Al inicializarse, realiza las siguientes acciones:
 * 1. Sobrescribe el método nativo window.alert() para redirigir todos los alerts
 *    al sistema de notificaciones Toast, clasificándolos por tipo (éxito, error, info).
 * 2. Verifica la conexión con el backend mediante una petición de prueba.
 */
@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, HeaderComponent, FooterComponent, ToastContainerComponent, ChatWidgetComponent],
  templateUrl: './app.html',
  styleUrls: []
})
export class AppComponent implements OnInit {

  // Servicio para realizar peticiones genéricas a la API del backend
  private api = inject(ApiService);
  // Servicio que gestiona el tema visual (modo claro/oscuro) de la aplicación
  private themeService = inject(ThemeService);
  // Servicio de internacionalización que gestiona el idioma activo de la interfaz
  private languageService = inject(LanguageService);
  // Servicio de notificaciones Toast para mostrar mensajes emergentes al usuario
  private toastService = inject(ToastService);

  /**
   * Se ejecuta al inicializar el componente raíz.
   *
   * Sobrescribe window.alert() para que todas las alertas del navegador se muestren
   * como notificaciones Toast estilizadas, clasificando automáticamente el tipo de
   * mensaje según palabras clave en el contenido (error, éxito, etc.).
   * También verifica que la conexión con el backend esté funcionando correctamente.
   */
  ngOnInit(): void {
    // Se reemplaza el alert nativo del navegador por las notificaciones Toast del sistema
    const originalAlert = window.alert;
    window.alert = (message: string) => {
      const lowerMsg = (message || '').toLowerCase();
      if (lowerMsg.includes('error') || lowerMsg.includes('falló') || lowerMsg.includes('incorrecto') || lowerMsg.includes('invalid')) {
        this.toastService.error(message);
      } else if (lowerMsg.includes('éxito') || lowerMsg.includes('exitoso') || lowerMsg.includes('correctamente') || lowerMsg.includes('confirmada')) {
        this.toastService.success(message);
      } else {
        this.toastService.info(message);
      }
    };

    // Se verifica la conexión con el backend al iniciar la aplicación
    this.api.testConexion().subscribe({
      next: () => { }, // Remove console log
      error: (err) => console.error('Error de conexión:', err)
    });
  }
}