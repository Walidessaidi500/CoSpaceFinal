import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';

import { RouterLink } from '@angular/router';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../../environments/enviroments';

/**
 * Interfaz que define la estructura de una reserva del cliente.
 * Incluye los datos de la reserva y la información del espacio asociado.
 */
interface Reserva {
    id_reserva: number;
    id_cliente: number;
    id_espacio: number;
    fecha_inicio: string;
    fecha_fin: string;
    monto_total: number;
    estado: string;
    espacio: {
        id_espacio: number;
        titulo: string;
        ciudad: string;
        direccion: string;
        precio_hora: number;
        fotos?: { url_foto: string }[];
    };
}

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente del Panel del Cliente
 *
 * Muestra el dashboard personal del cliente con pestañas para visualizar
 * sus reservas activas y pasadas. Cada reserva incluye información del espacio,
 * fechas, monto y acciones disponibles.
 *
 * Características:
 * - **Pestañas**: "Activas" (Confirmada, En_Curso, Pendiente) y "Pasadas" (Finalizada, Cancelada).
 * - **Formato de fechas**: Fechas en formato español abreviado.
 * - **Cancelación**: Los clientes pueden cancelar reservas activas con confirmación.
 * - **Imágenes**: Muestra la foto principal del espacio con fallback a placeholder.
 */
@Component({
    selector: 'app-panel-cliente',
    standalone: true,
    imports: [RouterLink, TranslateModule],
    templateUrl: './panel-cliente.component.html',
})
export class PanelClienteComponent implements OnInit {
    private http = inject(HttpClient);
    private cdr = inject(ChangeDetectorRef);

    /** Pestaña actualmente seleccionada: 'active' o 'past' */
    activeTab: 'active' | 'past' = 'active';
    /** Lista completa de todas las reservas del cliente */
    reservations: Reserva[] = [];
    /** Lista de reservas filtrada según la pestaña activa */
    filteredReservations: Reserva[] = [];
    isLoading = true;
    errorMessage = '';

    ngOnInit() {
        this.loadReservations();
    }

    /**
     * Carga todas las reservas del cliente desde la API.
     * Incluye el token de autenticación en la cabecera de la petición.
     */
    loadReservations() {
        this.isLoading = true;
        this.errorMessage = '';

        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.get<Reserva[]>(`${environment.apiUrl}/cliente/mis-reservas`, { headers })
            .subscribe({
                next: (data) => {
                    this.reservations = data;
                    this.filterReservations();
                    this.isLoading = false;
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error loading reservations:', err);
                    this.errorMessage = 'Error al cargar las reservas';
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
    }

    /** Cambia la pestaña activa y re-filtra las reservas. */
    setTab(tab: 'active' | 'past') {
        this.activeTab = tab;
        this.filterReservations();
    }

    /**
     * Filtra las reservas según la pestaña activa:
     * - Activas: estados Confirmada, En_Curso y Pendiente.
     * - Pasadas: estados Finalizada y Cancelada.
     */
    filterReservations() {
        if (this.activeTab === 'active') {
            this.filteredReservations = this.reservations.filter(r =>
                r.estado === 'Confirmada' || r.estado === 'En_Curso' || r.estado === 'Pendiente'
            );
        } else {
            this.filteredReservations = this.reservations.filter(r =>
                r.estado === 'Finalizada' || r.estado === 'Cancelada'
            );
        }
    }

    /** Formatea una fecha al formato español abreviado (ej: "15 ene 2026"). */
    formatDate(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    /** Formatea la hora de una fecha (ej: "14:30"). */
    formatTime(dateString: string): string {
        const date = new Date(dateString);
        return date.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit'
        });
    }

    /**
     * Calcula el número de días entre dos fechas.
     * Retorna un mínimo de 1 día.
     */
    calculateDays(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }

    /**
     * Cancela una reserva activa tras confirmación del usuario.
     * Actualiza el estado local de la reserva sin recargar desde el servidor.
     */
    cancelReservation(reserva: Reserva) {
        if (!confirm('¿Estás seguro de que quieres cancelar esta reserva?')) {
            return;
        }

        const token = localStorage.getItem('auth_token');
        const headers = new HttpHeaders().set('Authorization', `Bearer ${token}`);

        this.http.post(`${environment.apiUrl}/reservas/${reserva.id_reserva}/cancelar`, {}, { headers })
            .subscribe({
                next: () => {
                    // Se actualiza el estado local sin necesidad de recargar
                    reserva.estado = 'Cancelada';
                    this.filterReservations();
                },
                error: (err) => {
                    console.error('Error cancelling reservation:', err);
                    alert('Error al cancelar la reserva');
                }
            });
    }

    /**
     * Obtiene la URL de la imagen principal del espacio de una reserva.
     * Busca la foto principal; si no existe, usa la primera disponible.
     */
    getSpaceImage(reserva: Reserva): string {
        if (reserva.espacio?.fotos && reserva.espacio.fotos.length > 0) {
            // Se busca la foto principal del espacio
            const principalPhoto = reserva.espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true) || reserva.espacio.fotos[0];
            const url = principalPhoto.url_foto;

            if (url.startsWith('http') || url.startsWith('data:image')) return url;
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanUrl}`;
        }
        return 'assets/placeholder.jpg';
    }

    /** Maneja errores de carga de imágenes mostrando un placeholder. */
    handleImageError(event: any) {
        event.target.src = 'assets/placeholder.jpg';
    }
}
