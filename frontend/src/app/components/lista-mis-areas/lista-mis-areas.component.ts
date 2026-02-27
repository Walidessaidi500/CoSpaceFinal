import { Component, OnInit, Inject, PLATFORM_ID, ChangeDetectorRef, NgZone } from '@angular/core';
import { isPlatformBrowser } from '@angular/common';
import { RouterModule, Router } from '@angular/router';
import { EspaciosService } from '../../services/espacios';
import { environment } from '../../../environments/enviroments';

/**
 * Componente de Listado de Áreas del Anfitrión (Lista Mis Áreas)
 *
 * Muestra una cuadrícula de tarjetas con todos los espacios publicados por el anfitrión
 * actualmente autenticado. Cada tarjeta incluye la imagen principal, el título,
 * la ciudad y las acciones disponibles (ver detalles, editar, eliminar).
 *
 * La carga de espacios solo se ejecuta en el navegador (isPlatformBrowser)
 * para evitar errores en el renderizado del lado del servidor (SSR).
 *
 * Utiliza NgZone.run() para asegurar que Angular detecte los cambios
 * provenientes de las respuestas HTTP asíncronas.
 */
@Component({
    selector: 'app-lista-mis-areas',
    standalone: true,
    imports: [RouterModule],
    templateUrl: './lista-mis-areas.component.html'
})
export class ListaMisAreasComponent implements OnInit {
    /** Lista de espacios del anfitrión autenticado */
    espacios: any[] = [];
    /** Mensaje de error si falla la carga de espacios */
    errorMessage: string = '';
    /** Indicador de estado de carga */
    isLoading: boolean = true;
    /** URL base del backend para construir rutas de imágenes */
    backendUrl = 'http://127.0.0.1:8000';

    constructor(
        private espaciosService: EspaciosService,
        private router: Router,
        @Inject(PLATFORM_ID) private platformId: Object,
        private cdr: ChangeDetectorRef,
        private ngZone: NgZone
    ) { }

    /**
     * Solo carga los espacios en el navegador para evitar errores en SSR,
     * ya que las peticiones HTTP con tokens de autenticación no funcionan en el servidor.
     */
    ngOnInit() {
        if (isPlatformBrowser(this.platformId)) {
            this.cargarEspacios();
        }
    }

    /**
     * Carga los espacios del anfitrión autenticado desde la API.
     * Utiliza NgZone.run() para asegurar la detección de cambios correcta.
     */
    cargarEspacios() {
        console.log('Solicitando espacios a través del servicio...');
        this.isLoading = true;
        this.espaciosService.getEspaciosAnfitrion().subscribe({
            next: (data) => {
                this.ngZone.run(() => {
                    this.espacios = data;
                    this.isLoading = false;
                    console.log('Espacios cargados (HTTP):', this.espacios);
                    this.cdr.detectChanges();
                });
            },
            error: (err) => {
                this.ngZone.run(() => {
                    console.error('Error HTTP:', err);
                    this.errorMessage = 'Error de conexión: ' + (err.message || err);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                });
            }
        });
    }

    /**
     * Obtiene la URL de la imagen principal de un espacio.
     * Busca primero la foto marcada como principal; si no existe, usa la primera.
     * Si no hay fotos, devuelve una imagen de placeholder.
     */
    getImagenPrincipal(espacio: any): string {
        if (espacio.fotos && espacio.fotos.length > 0) {
            // Se busca la foto principal del espacio
            const principal = espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true);
            const relativeUrl = principal ? principal.url_foto : espacio.fotos[0].url_foto;

            // Si la URL ya es absoluta, se devuelve directamente
            if (relativeUrl.startsWith('http') || relativeUrl.startsWith('data:image')) {
                return relativeUrl;
            }
            // Se construye la URL completa usando la URL base de la API
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            const cleanUrl = relativeUrl.startsWith('/') ? relativeUrl : `/${relativeUrl}`;
            return `${baseUrl}${cleanUrl}`;
        }
        // Imagen de placeholder si el espacio no tiene fotos
        return 'https://via.placeholder.com/400x300?text=No+Image';
    }

    /**
     * Elimina un espacio tras confirmación del usuario.
     * Actualiza la lista local de espacios sin necesidad de recargar desde el servidor.
     */
    borrarEspacio(id: number) {
        if (confirm('¿Estás seguro de que quieres eliminar este espacio?')) {
            this.espaciosService.deleteEspacio(id).subscribe({
                next: () => {
                    // Se filtra el espacio eliminado de la lista local
                    this.espacios = this.espacios.filter(e => e.id_espacio !== id);
                    alert('Espacio eliminado correctamente');
                },
                error: (err) => {
                    console.error('Error al borrar:', err);
                    alert('Ocurrió un error al intentar borrar el espacio.');
                }
            });
        }
    }

    /** Navega a la vista de detalles del espacio al hacer clic en la tarjeta. */
    onCardClick(id: number) {
        console.log('Card clicked, navigating to space:', id);
        if (id) {
            this.router.navigate(['/espacios', id]);
        }
    }
}
