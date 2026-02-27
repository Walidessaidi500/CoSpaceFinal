import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule, DatePipe, CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReservaService } from '../../services/reserva.service';
import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { environment } from '../../../environments/enviroments';
import { ChatService } from '../../services/chat.service';

import { RouterLink } from '@angular/router';

/**
 * Componente de Reservas del Anfitrión
 *
 * Muestra un listado de todas las reservas realizadas en los espacios del anfitrión
 * autenticado. Permite visualizar los detalles de cada reserva y cambiar su estado.
 *
 * Características:
 * - **Listado**: Muestra reservas con imagen del espacio, datos del cliente, fechas y monto.
 * - **Cambio de estado**: El anfitrión puede cambiar el estado desde un select
 *   (Confirmada, En_Curso, Finalizada, Cancelada).
 * - **Timeout**: Implementa un timeout de 10 segundos para prevenir bloqueos de interfaz.
 * - **Rollback**: Si el cambio de estado falla, revierte al estado anterior.
 */
@Component({
    selector: 'app-reservas-anfitrion',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarAnfitrionComponent, DatePipe, CurrencyPipe, RouterLink],
    templateUrl: './reservas-anfitrion.component.html',
})
export class ReservasAnfitrionComponent implements OnInit {
    private reservaService = inject(ReservaService);
    private chatService = inject(ChatService);
    private cdr = inject(ChangeDetectorRef);

    /** Lista de reservas de los espacios del anfitrión */
    reservas: any[] = [];
    isLoading = true;
    errorMessage = '';
    /** ID de la reserva cuyo estado se está actualizando */
    updatingId: number | null = null;

    /** Estados posibles para las reservas del anfitrión */
    estadosDisponibles = ['Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'];

    ngOnInit() {
        this.loadReservas();
    }

    /**
     * Carga las reservas del anfitrión desde el backend.
     * Incluye un timeout de 10 segundos para evitar que la interfaz
     * quede bloqueada indefinidamente si el servidor no responde.
     */
    loadReservas() {
        this.isLoading = true;
        this.errorMessage = '';

        // Timeout de seguridad: si la respuesta tarda más de 10 segundos, se muestra un error
        const timeoutId = setTimeout(() => {
            if (this.isLoading) {
                this.isLoading = false;
                this.errorMessage = 'Tiempo de espera agotado. Por favor, recarga la página.';
                this.cdr.detectChanges();
            }
        }, 10000);

        this.reservaService.getHostReservations().subscribe({
            next: (data) => {
                clearTimeout(timeoutId);
                console.log('Reservas recibidas (Raw):', data);
                this.reservas = data;
                this.errorMessage = '';
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                clearTimeout(timeoutId);
                console.error('Error cargando reservas:', err);
                this.errorMessage = err.error?.message || 'No se pudieron cargar las reservas.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Cambia el estado de una reserva. Guarda el estado anterior
     * para revertir en caso de error (patrón rollback).
     */
    onEstadoChange(reserva: any, nuevoEstado: string) {
        if (nuevoEstado === reserva.estado) return;

        const estadoAnterior = reserva.estado;
        this.updatingId = reserva.id_reserva;

        this.reservaService.updateEstadoAnfitrion(reserva.id_reserva, nuevoEstado).subscribe({
            next: () => {
                reserva.estado = nuevoEstado;
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err) => {
                console.error('Error actualizando estado:', err);
                // Se revierte al estado anterior si la actualización falla
                reserva.estado = estadoAnterior;
                this.updatingId = null;
                alert('Error al actualizar el estado: ' + (err.error?.message || 'Error desconocido'));
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Inicia una conversación de chat con el cliente de la reserva.
     */
    contactarCliente(idCliente: number) {
        if (!idCliente) return;

        this.chatService.startConversation(idCliente).subscribe({
            next: () => {
                // El chat widget se abrirá automáticamente desde el servicio
            },
            error: (err) => {
                console.error('Error al iniciar conversación con el cliente:', err);
                alert('Hubo un error al intentar contactar con el cliente.');
            }
        });
    }

    /** Formatea la etiqueta de estado reemplazando guiones bajos por espacios. */
    getEstadoLabel(estado: string): string {
        return estado.replace('_', ' ');
    }

    /**
     * Obtiene la URL de la imagen principal del espacio asociado a una reserva.
     * Busca la foto marcada como principal; si no existe, usa la primera.
     */
    getEspacioImage(reserva: any): string {
        if (reserva.espacio?.fotos?.length > 0) {
            const principalPhoto = reserva.espacio.fotos.find((f: any) => f.es_principal == 1 || f.es_principal === true) || reserva.espacio.fotos[0];
            const url = principalPhoto.url_foto;

            if (url.startsWith('http') || url.startsWith('data:image')) return url;
            const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
            const cleanUrl = url.startsWith('/') ? url : `/${url}`;
            return `${baseUrl}${cleanUrl}`;
        }
        return 'assets/placeholder.jpg';
    }

    /**
     * Calcula el número de días entre dos fechas.
     * Si la diferencia es 0, devuelve 1 como mínimo.
     */
    calculateDays(start: string, end: string): number {
        const startDate = new Date(start);
        const endDate = new Date(end);
        const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays || 1;
    }

    /** Maneja errores de carga de imágenes mostrando un placeholder. */
    handleImageError(event: any) {
        event.target.src = 'assets/placeholder.jpg';
    }
}
