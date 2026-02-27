import { Component, Input } from '@angular/core';
import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/enviroments';

/**
 * Componente Tarjeta de Espacio (Espacio Card)
 *
 * Muestra una tarjeta resumen de un espacio de coworking en las vistas de listado.
 * Incluye la imagen principal del espacio, el precio con comisión aplicada,
 * y un enlace a la vista de detalles del espacio.
 *
 * El precio mostrado al usuario incluye una comisión del 14.59% sobre el precio base
 * por hora, correspondiente a los gastos de gestión de la plataforma CoSpace.
 */
@Component({
  selector: 'app-espacio-card',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './espacio-card.component.html',
  styleUrl: './espacio-card.component.css',
})
export class EspacioCardComponent {
  /** Datos del espacio recibidos desde el componente padre mediante binding de entrada */
  @Input() espacio: any;

  /** Tasa de comisión de la plataforma: 14.59% sobre el precio base por gastos de gestión */
  private readonly COMMISSION_RATE = 0.1459;

  /**
   * Calcula el precio por hora con la comisión de la plataforma aplicada.
   * @returns Precio formateado con 2 decimales como cadena de texto.
   */
  getPrecioConComision(): string {
    const precioBase = parseFloat(this.espacio?.precio_hora) || 0;
    const precioConComision = precioBase * (1 + this.COMMISSION_RATE);
    return precioConComision.toFixed(2);
  }

  /**
   * Obtiene la URL de la imagen principal del espacio.
   * Busca primero la foto marcada como principal (es_principal = 1).
   * Si no hay ninguna marcada, usa la primera foto disponible.
   * Si no hay fotos, devuelve una imagen de placeholder de Unsplash.
   * @returns URL completa de la imagen.
   */
  getImagenPrincipal(): string {
    if (this.espacio?.fotos && this.espacio.fotos.length > 0) {
      // Se busca la foto principal; si no existe, se usa la primera del array
      const principal = this.espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true);
      const foto = principal || this.espacio.fotos[0];
      const url = foto.url_foto;

      // Si la URL ya es absoluta, se devuelve directamente
      if (url.startsWith('http')) return url;
      // Se construye la URL completa a partir de la URL base de la API
      const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
      const cleanUrl = url.startsWith('/') ? url : `/${url}`;
      return `${baseUrl}${cleanUrl}`;
    }
    // Imagen de placeholder si el espacio no tiene fotos
    return 'https://images.unsplash.com/photo-1497366216548-37526070297c?auto=format&fit=crop&w=800&q=80';
  }
}
