import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { EspacioCardComponent } from '../espacio-card/espacio-card.component';
import { ApiService } from '../../services/api';

import { TranslateModule } from '@ngx-translate/core';
import { RouterModule } from '@angular/router';

/**
 * Componente de Exploración de Espacios
 *
 * Muestra un listado completo de todos los espacios de coworking disponibles
 * en la plataforma, con un sistema de filtrado múltiple que permite:
 *
 * - **Filtro por ciudad**: búsqueda parcial por nombre de ciudad.
 * - **Filtro por rango de precio**: menos de 20€, entre 20-50€, o más de 50€/hora.
 * - **Filtro por estado**: disponibilidad del espacio (Disponible, Mantenimiento, etc.).
 * - **Filtro por rating**: puntuación mínima de las valoraciones.
 *
 * Los filtros se aplican de forma combinada y en tiempo real sobre el listado.
 */
@Component({
  selector: 'app-explorar',
  standalone: true,
  imports: [RouterModule, FormsModule, EspacioCardComponent, TranslateModule],
  templateUrl: './explorar.component.html',
  styleUrl: './explorar.component.css',
})
export class ExplorarComponent implements OnInit {
  private api = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  /** Lista de espacios actualmente visibles (tras aplicar filtros) */
  listaEspacios: any[] = [];
  /** Copia completa de todos los espacios sin filtrar */
  todosEspacios: any[] = [];
  /** Mensaje de error si falla la carga de espacios */
  errorMessage: string = '';
  /** Indicador de estado de carga */
  isLoading: boolean = true;

  // Valores de los filtros
  filtroCiudad: string = '';
  filtroPrecio: string = '';
  filtroEstado: string = '';
  filtroRating: string = '';

  /**
   * Carga todos los espacios disponibles desde la API al inicializar el componente.
   * Ambos arrays (todosEspacios y listaEspacios) se inicializan con los mismos datos.
   */
  ngOnInit() {
    this.isLoading = true;
    this.api.getEspacios().subscribe({
      next: (data: any) => {
        this.todosEspacios = data;
        this.listaEspacios = data;
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error al cargar espacios', err);
        this.errorMessage = 'Error conectando con el servidor: ' + err.message;
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Aplica todos los filtros activos de forma combinada sobre la lista completa de espacios.
   * Los filtros son acumulativos: un espacio debe cumplir todos los criterios activos.
   */
  filtrarEspacios() {
    let filtered = [...this.todosEspacios];

    // 1. Filtro por ciudad (búsqueda parcial, insensible a mayúsculas)
    if (this.filtroCiudad) {
      const ter = this.filtroCiudad.toLowerCase();
      filtered = filtered.filter(e =>
        e.ciudad && e.ciudad.toLowerCase().includes(ter)
      );
    }

    // 2. Filtro por rango de precio por hora
    if (this.filtroPrecio) {
      if (this.filtroPrecio === '0-20') {
        filtered = filtered.filter(e => Number(e.precio_hora) < 20);
      } else if (this.filtroPrecio === '20-50') {
        filtered = filtered.filter(e => Number(e.precio_hora) >= 20 && Number(e.precio_hora) <= 50);
      } else if (this.filtroPrecio === '50+') {
        filtered = filtered.filter(e => Number(e.precio_hora) > 50);
      }
    }

    // 3. Filtro por estado de disponibilidad del espacio
    if (this.filtroEstado) {
      filtered = filtered.filter(e => e.estado === this.filtroEstado);
    }

    // 4. Filtro por puntuación mínima de reseñas
    if (this.filtroRating) {
      const minRating = Number(this.filtroRating);
      filtered = filtered.filter(e => Number(e.rating_promedio) >= minRating);
    }

    this.listaEspacios = filtered;
  }
}
