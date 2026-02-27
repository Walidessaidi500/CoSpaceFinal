import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

import { ActivatedRoute, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ApiService } from '../../services/api';
import { ValoracionService } from '../../services/valoracion.service';
import { GoogleMapsModule } from '@angular/google-maps';
import { AuthService } from '../../services/auth.service';
import { environment } from '../../../environments/enviroments';
import { ChatService } from '../../services/chat.service';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Detalles de Espacio
 *
 * Muestra toda la información detallada de un espacio de coworking, incluyendo:
 *
 * 1. **Información general**: Título, dirección, descripción, precio (con comisión), puntuación.
 * 2. **Galería de fotos**: Imágenes del espacio con modal de ampliación.
 * 3. **Mapa**: Ubicación en Google Maps con marcador.
 * 4. **Servicios**: Lista de amenidades con iconos SVG correspondientes.
 * 5. **Valoraciones**: Sistema completo de reseñas con filtrado, ordenamiento y paginación.
 * 6. **Formulario de valoración**: Los clientes pueden enviar reseñas con puntuación.
 * 7. **Chat**: Los clientes pueden contactar al anfitrión directamente.
 * 8. **Reportes**: Los clientes pueden reportar un espacio por diversos motivos.
 *
 * El precio mostrado incluye una comisión del 14.59% (gastos de gestión de la plataforma).
 */
@Component({
  selector: 'app-espacios-detalles',
  standalone: true,
  imports: [RouterModule, GoogleMapsModule, TranslateModule, FormsModule],
  templateUrl: './espacios-detalles.component.html',
  styleUrl: './espacios-detalles.component.css',
})
export class EspaciosDetallesComponent implements OnInit {
  // Inyección de dependencias
  private route = inject(ActivatedRoute);
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private valoracionService = inject(ValoracionService);
  private cdr = inject(ChangeDetectorRef);
  private sanitizer = inject(DomSanitizer);
  private http = inject(HttpClient);
  private chatService = inject(ChatService);

  /** Datos completos del espacio transformados para la vista */
  space: any = null;
  isLoading: boolean = true;
  errorMessage: string = '';
  /** Rol del usuario actual para controlar la visibilidad de acciones */
  currentUserRole: string | null = null;

  /** Tasa de comisión aplicada al precio base (14.59% por gastos de gestión) */
  private readonly COMMISSION_RATE = 0.1459;

  // ========================
  // CONFIGURACIÓN DE GOOGLE MAPS
  // ========================
  mapOptions: google.maps.MapOptions = {
    center: { lat: 40, lng: -3 },
    zoom: 15,
    disableDefaultUI: false,
    zoomControl: true,
    mapId: 'DEMO_MAP_ID' // Required for advanced markers
  };
  markerPosition: google.maps.LatLngLiteral = { lat: 40, lng: -3 };

  /** Indica si se accedió a la vista en modo "ya reservado" (para mostrar info post-reserva) */
  isReservedMode: boolean = false;

  // ========================
  // SECCIÓN DE VALORACIONES
  // ========================
  /** Lista de valoraciones del espacio */
  valoraciones: any[] = [];
  /** Resumen estadístico: promedio, total y distribución por estrellas */
  resumenValoraciones: any = { promedio: 0, total: 0, distribucion: {} };
  /** Criterio de ordenamiento actual ('reciente', 'antiguo', 'mayor', 'menor') */
  sortBy: string = 'reciente';
  /** Filtro activo por puntuación específica (1-5 estrellas) */
  filterPuntuacion: number | null = null;
  /** Página actual de la paginación de valoraciones */
  currentPage: number = 1;
  /** Última página disponible de valoraciones */
  lastPage: number = 1;
  isLoadingValoraciones: boolean = false;

  // Formulario de nueva valoración
  nuevaPuntuacion: number = 0;
  nuevoComentario: string = '';
  /** Puntuación sobre la que se hace hover (para previsualización de estrellas) */
  hoverPuntuacion: number = 0;
  isSubmitting: boolean = false;
  /** Indica si el usuario actual ya ha valorado este espacio */
  yaValorado: boolean = false;
  submitSuccess: string = '';
  submitError: string = '';

  // ========================
  // SECCIÓN DE REPORTES
  // ========================
  showReporteModal: boolean = false;
  reporteMotivo: string = '';
  reporteDescripcion: string = '';
  isSubmittingReporte: boolean = false;
  reporteSuccess: string = '';
  reporteError: string = '';
  /** Lista de motivos disponibles para reportar un espacio */
  motivosReporte = [
    { value: 'reserva_fraudulenta', label: 'Reserva fraudulenta' },
    { value: 'contenido_inapropiado', label: 'Contenido inapropiado' },
    { value: 'informacion_falsa', label: 'Información falsa o engañosa' },
    { value: 'espacio_inseguro', label: 'Espacio inseguro' },
    { value: 'incumplimiento_normas', label: 'Incumplimiento de normas' },
    { value: 'otro', label: 'Otro motivo' }
  ];

  /**
   * Inicializa el componente: obtiene el rol del usuario, verifica el modo de vista,
   * y carga los detalles del espacio y sus valoraciones.
   */
  ngOnInit() {
    this.currentUserRole = this.authService.getRole();

    // Se verifica si se accede en modo "reservado" (query param ?mode=reserved)
    this.route.queryParams.subscribe(params => {
      this.isReservedMode = params['mode'] === 'reserved';
    });

    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.fetchSpaceDetails(id);
      this.loadValoraciones(id);
    } else {
      this.errorMessage = 'No se proporcionó un ID de espacio válido.';
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  /** Verifica si el usuario actual es un anfitrión */
  get isAnfitrion(): boolean {
    return this.currentUserRole === 'Anfitrion';
  }

  /** Verifica si el usuario actual es un cliente */
  get isCliente(): boolean {
    return this.currentUserRole === 'Cliente';
  }

  /** Verifica si hay un usuario autenticado */
  get isAuthenticated(): boolean {
    return this.currentUserRole !== null && this.currentUserRole !== undefined;
  }

  /**
   * Inicia una conversación con el anfitrión del espacio.
   * Solo disponible para clientes autenticados.
   */
  contactarAnfitrion(): void {
    if (!this.isAuthenticated) {
      alert('Inicia sesión para contactar con el anfitrión');
      return;
    }

    if (this.isAnfitrion) {
      alert('Los anfitriones no pueden contactar otros anfitriones');
      return;
    }

    if (!this.space?.anfitrionId) return;

    this.chatService.startConversation(this.space.anfitrionId).subscribe({
      next: () => {
        // El chat se abre automáticamente desde el servicio
      },
      error: (err: any) => {
        console.error('Error al iniciar conversación:', err);
        alert('Error al iniciar la conversación');
      }
    });
  }

  /**
   * Obtiene los detalles completos del espacio desde la API.
   * Transforma los datos del backend al formato de la vista,
   * incluyendo el cálculo del precio con comisión y la configuración del mapa.
   */
  fetchSpaceDetails(id: string) {
    this.isLoading = true;
    this.apiService.getEspacioById(id).subscribe({
      next: (data: any) => {
        try {
          // Se transforman los datos del backend al formato esperado por la vista
          this.space = {
            id: data.id_espacio,
            titulo: data.titulo,
            direccion: `${data.direccion}, ${data.ciudad}`,
            descripcion: data.descripcion,
            // Se aplica la comisión del 14.59% al precio base
            precio: (parseFloat(data.precio_hora) * (1 + this.COMMISSION_RATE)).toFixed(2),
            puntuacion: data.rating_promedio || 'N/A',
            total_resenas: data.total_resenas || 0,
            latitud: data.latitud,
            longitud: data.longitud,
            // Se ordenan las fotos poniendo la principal primero
            imagenes: (data.fotos && data.fotos.length > 0)
              ? this.sortFotosPrincipalFirst(data.fotos).map((f: any) => this.getFullUrl(f.url_foto))
              : [],
            // Se mapean los servicios con sus iconos SVG
            caracteristicas: data.servicios ? data.servicios.map((s: any) => ({
              nombre: s.nombre_servicio,
              icono: this.getIconForService(s.nombre_servicio)
            })) : [],
            anfitrionId: data.id_anfitrion,
            anfitrionNombre: data.anfitrion?.usuario?.nombre_completo || 'Anfitrión',
            anfitrionFoto: this.getAnfitrionFoto(data.anfitrion?.usuario?.foto_perfil)
          };

          // Se configura el mapa de Google Maps con las coordenadas del espacio
          if (data.latitud && data.longitud) {
            const lat = parseFloat(data.latitud);
            const lng = parseFloat(data.longitud);
            this.mapOptions = {
              ...this.mapOptions,
              center: { lat, lng }
            };
            this.markerPosition = { lat, lng };
          }

          this.isLoading = false;
          this.cdr.detectChanges();
        } catch (e) {
          console.error('Error transformando datos:', e);
          this.errorMessage = 'Error al procesar los datos del espacio.';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error fetching space details:', err);
        this.errorMessage = 'No se pudo cargar la información del espacio.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========================
  // MÉTODOS DE VALORACIONES
  // ========================

  /**
   * Carga las valoraciones del espacio con soporte para ordenamiento,
   * filtrado por puntuación y paginación desde el backend.
   * También verifica si el usuario actual ya ha valorado el espacio.
   */
  loadValoraciones(espacioId?: string) {
    const id = espacioId || this.space?.id?.toString();
    if (!id) return;

    this.isLoadingValoraciones = true;
    this.valoracionService.getValoraciones(id, {
      sort: this.sortBy,
      puntuacion: this.filterPuntuacion || undefined,
      page: this.currentPage
    }).subscribe({
      next: (data: any) => {
        this.resumenValoraciones = data.resumen;
        this.valoraciones = data.valoraciones?.data || [];
        this.currentPage = data.valoraciones?.current_page || 1;
        this.lastPage = data.valoraciones?.last_page || 1;
        this.isLoadingValoraciones = false;

        // Se verifica si el usuario actual ya ha dejado una valoración
        if (this.isCliente) {
          const currentUser = this.authService.getUser();
          if (currentUser) {
            this.yaValorado = this.valoraciones.some(
              (v: any) => v.id_usuario === currentUser.id_usuario
            );
          }
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading valoraciones:', err);
        this.isLoadingValoraciones = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Cambia el criterio de ordenamiento y recarga las valoraciones desde la primera página. */
  cambiarOrden(sort: string) {
    this.sortBy = sort;
    this.currentPage = 1;
    this.loadValoraciones();
  }

  /** Activa o desactiva el filtro por puntuación específica (toggle). */
  filtrarPorPuntuacion(puntuacion: number | null) {
    this.filterPuntuacion = this.filterPuntuacion === puntuacion ? null : puntuacion;
    this.currentPage = 1;
    this.loadValoraciones();
  }

  /** Navega a una página específica de valoraciones. */
  cambiarPagina(page: number) {
    if (page >= 1 && page <= this.lastPage) {
      this.currentPage = page;
      this.loadValoraciones();
    }
  }

  /** Establece la puntuación de hover para previsualización visual. */
  setHoverPuntuacion(star: number) {
    this.hoverPuntuacion = star;
  }

  /** Limpia la previsualización de puntuación al quitar el hover. */
  clearHoverPuntuacion() {
    this.hoverPuntuacion = 0;
  }

  /** Establece la puntuación seleccionada por el usuario. */
  setPuntuacion(star: number) {
    this.nuevaPuntuacion = star;
  }

  /**
   * Envía una nueva valoración/reseña para el espacio actual.
   * Tras el envío exitoso, recarga las valoraciones y actualiza el resumen.
   */
  submitValoracion() {
    if (this.nuevaPuntuacion < 1 || this.nuevaPuntuacion > 5) {
      this.submitError = 'Selecciona una puntuación de 1 a 5 estrellas';
      return;
    }

    this.isSubmitting = true;
    this.submitError = '';
    this.submitSuccess = '';

    this.valoracionService.crearValoracion(this.space.id, {
      puntuacion: this.nuevaPuntuacion,
      comentario: this.nuevoComentario || undefined
    }).subscribe({
      next: (response: any) => {
        this.submitSuccess = '¡Reseña enviada correctamente!';
        this.yaValorado = true;
        this.nuevaPuntuacion = 0;
        this.nuevoComentario = '';
        this.isSubmitting = false;

        // Se recargan las valoraciones para reflejar la nueva reseña
        this.loadValoraciones();

        // Se actualiza el rating mostrado en la cabecera del espacio
        if (this.resumenValoraciones) {
          this.space.puntuacion = this.resumenValoraciones.promedio;
          this.space.total_resenas = this.resumenValoraciones.total;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error submitting valoracion:', err);
        this.submitError = err.error?.message || 'Error al enviar la reseña';
        this.isSubmitting = false;
        this.cdr.detectChanges();
      }
    });
  }

  /** Devuelve un array [1,2,3,4,5] para renderizar las estrellas de puntuación. */
  getStarArray(): number[] {
    return [1, 2, 3, 4, 5];
  }

  /** Formatea una fecha ISO a formato legible en español (ej: "15 de enero de 2026"). */
  formatFecha(fecha: string): string {
    const date = new Date(fecha);
    return date.toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  /** Obtiene la inicial en mayúsculas del nombre para usar como avatar por defecto. */
  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : '?';
  }

  /** Obtiene la URL completa de la foto de perfil del autor de una valoración. */
  getAutorFoto(valoracion: any): string | null {
    if (valoracion.autor?.foto_perfil) {
      const foto = valoracion.autor.foto_perfil;
      if (foto.startsWith('http') || foto.startsWith('data:image')) return foto;
      const storagePath = foto.startsWith('/storage/') ? foto
        : foto.startsWith('storage/') ? `/${foto}`
          : `/storage/${foto}`;
      return this.getFullUrl(storagePath);
    }
    return null;
  }

  /** Obtiene la URL completa de la foto de perfil del anfitrión del espacio. */
  getAnfitrionFoto(foto: string | null): string | null {
    if (!foto) return null;
    if (foto.startsWith('http') || foto.startsWith('data:image')) return foto;
    const storagePath = foto.startsWith('/storage/') ? foto
      : foto.startsWith('storage/') ? `/${foto}`
        : `/storage/${foto}`;
    return `${environment.baseUrl}${storagePath.startsWith('/') ? storagePath : `/${storagePath}`}`;
  }

  // ========================
  // MÉTODOS AUXILIARES
  // ========================

  /**
   * Construye la URL completa a partir de una ruta relativa del backend.
   * Si ya es una URL absoluta (http/https), la devuelve sin modificar.
   */
  private getFullUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanUrl = path.startsWith('/') ? path : `/${path}`;
    return `${baseUrl}${cleanUrl}`;
  }

  /**
   * Ordena las fotos del espacio poniendo la principal (es_principal) primero.
   * Esto asegura que la imagen principal se muestre como primera en la galería.
   */
  private sortFotosPrincipalFirst(fotos: any[]): any[] {
    return [...fotos].sort((a, b) => {
      const aIsPrincipal = a.es_principal == 1 || a.es_principal === true;
      const bIsPrincipal = b.es_principal == 1 || b.es_principal === true;
      if (aIsPrincipal && !bIsPrincipal) return -1;
      if (!aIsPrincipal && bIsPrincipal) return 1;
      return 0;
    });
  }

  /**
   * Devuelve el icono SVG correspondiente a un servicio/amenidad del espacio.
   * Busca coincidencias parciales del nombre del servicio en un diccionario de iconos.
   * Si no hay coincidencia, devuelve un icono genérico de estrella.
   */
  private getIconForService(name: string): SafeHtml {
    const icons: { [key: string]: string } = {
      'WiFi': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.55a11 11 0 0 1 14.08 0"></path><path d="M1.42 9a16 16 0 0 1 21.16 0"></path><path d="M8.53 16.11a6 6 0 0 1 6.95 0"></path><line x1="12" y1="20" x2="12.01" y2="20"></line></svg>',
      'Café': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 8h1a4 4 0 0 1 0 8h-1"></path><path d="M2 8h16v9a4 4 0 0 1-4 4H6a4 4 0 0 1-4-4V8z"></path><line x1="6" y1="1" x2="6" y2="4"></line><line x1="10" y1="1" x2="10" y2="4"></line><line x1="14" y1="1" x2="14" y2="4"></line></svg>',
      'Impresora': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 6 2 18 2 18 9"></polyline><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path><rect x="6" y="14" width="12" height="8"></rect></svg>',
      'Salas de Reuniones': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M23 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>',
      'Estacionamiento': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>',
      'Aire Acondicionado': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.59 4.59A2 2 0 1 1 11 8H2m10.59 11.41A2 2 0 1 0 14 16H2m15.73-8.27A2.5 2.5 0 1 1 19.5 12H2"></path></svg>',
      'Pizarras': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect><line x1="8" y1="21" x2="16" y2="21"></line><line x1="12" y1="17" x2="12" y2="21"></line></svg>',
      'Cocina': '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"></path><path d="M7 2v20"></path><path d="M21 15V2v0a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3"></path></svg>'
    };

    // Si no se encuentra un icono específico, se usa uno genérico de estrella
    let svgStr = '<svg xmlns="http://www.w3.org/2000/svg" class="w-8 h-8" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"></path></svg>';

    for (const key in icons) {
      if (name.toLowerCase().includes(key.toLowerCase())) {
        svgStr = icons[key];
        break;
      }
    }
    // Se usa bypassSecurityTrustHtml para renderizar el SVG de forma segura
    return this.sanitizer.bypassSecurityTrustHtml(svgStr);
  }

  // ========================
  // MÉTODOS DEL MODAL DE REPORTE
  // ========================

  /** Abre el modal de reporte y resetea el formulario. */
  openReporteModal() {
    this.showReporteModal = true;
    this.reporteMotivo = '';
    this.reporteDescripcion = '';
    this.reporteSuccess = '';
    this.reporteError = '';
  }

  /** Cierra el modal de reporte. */
  closeReporteModal() {
    this.showReporteModal = false;
  }

  /**
   * Envía un reporte sobre el espacio al backend.
   * Tras el envío exitoso, cierra el modal automáticamente tras 2.5 segundos.
   */
  submitReporte() {
    if (!this.reporteMotivo) {
      this.reporteError = 'Selecciona un motivo para el reporte';
      return;
    }

    this.isSubmittingReporte = true;
    this.reporteError = '';
    this.reporteSuccess = '';

    this.http.post(`${environment.apiUrl}/espacios/${this.space.id}/reportes`, {
      motivo: this.reporteMotivo,
      descripcion: this.reporteDescripcion || null
    }).subscribe({
      next: () => {
        this.reporteSuccess = '¡Reporte enviado correctamente! Lo revisaremos lo antes posible.';
        this.isSubmittingReporte = false;
        // Se cierra el modal automáticamente tras 2.5 segundos
        setTimeout(() => this.closeReporteModal(), 2500);
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.reporteError = err.error?.message || 'Error al enviar el reporte';
        this.isSubmittingReporte = false;
        this.cdr.detectChanges();
      }
    });
  }

  // ========================
  // MODAL DE AMPLIACIÓN DE IMAGEN
  // ========================

  /** Indica si el modal de imagen ampliada está abierto */
  isModalOpen: boolean = false;
  /** URL de la imagen seleccionada para ampliar */
  selectedImage: string = '';

  /** Abre el modal de ampliación de imagen. */
  openModal(imageUrl: string) {
    if (imageUrl) {
      this.selectedImage = imageUrl;
      this.isModalOpen = true;
    }
  }

  /** Cierra el modal de ampliación de imagen. */
  closeModal() {
    this.isModalOpen = false;
    this.selectedImage = '';
  }
}
