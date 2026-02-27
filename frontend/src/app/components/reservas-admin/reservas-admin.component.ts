import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Gestión de Reservas del Administrador
 *
 * Muestra un listado de todas las reservas de la plataforma con funcionalidades de:
 *
 * - **Búsqueda**: Por nombre del cliente o título del espacio.
 * - **Filtrado**: Por estado de la reserva (Pendiente, Confirmada, En_Curso, Finalizada, Cancelada).
 * - **Cambio de estado**: El administrador puede cambiar el estado directamente desde el listado.
 * - **Eliminación**: Con modal de confirmación reutilizable.
 * - **Navegación**: Enlace a la vista de edición individual de cada reserva.
 *
 * Al cambiar el estado de una reserva, se guarda el estado anterior para revertir
 * en caso de error en la petición al backend (patrón optimista con rollback).
 */
@Component({
    selector: 'app-reservas-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarAdminComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './reservas-admin.component.html',
    styleUrls: ['./reservas-admin.component.css'],
})
export class ReservasAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    /** Lista completa de reservas sin filtrar */
    allReservas: any[] = [];
    /** Lista de reservas visible tras aplicar filtros */
    reservas: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    /** ID de la reserva que se está eliminando */
    deletingId: number | null = null;
    /** ID de la reserva cuyo estado se está actualizando */
    updatingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';

    /** Estados posibles de una reserva */
    estadosDisponibles = ['Pendiente', 'Confirmada', 'En_Curso', 'Finalizada', 'Cancelada'];

    // Estado del modal de eliminación
    showDeleteModal = false;
    itemToDeleteId: number | null = null;

    ngOnInit() { this.loadReservas(); }

    /** Obtiene todas las reservas desde la API del administrador. */
    loadReservas() {
        this.isLoading = true;
        this.adminService.getAllReservations().subscribe({
            next: (data) => {
                this.allReservas = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar las reservas. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /** Aplica filtros de búsqueda y estado sobre la lista de reservas. */
    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.reservas = this.allReservas.filter(r => {
            const matchSearch = !term ||
                r.cliente?.toLowerCase().includes(term) ||
                r.espacio?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || r.estado === this.filterEstado;
            return matchSearch && matchEstado;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.reservas.length; }
    get totalReservas() { return this.allReservas.length; }

    /**
     * Cambia el estado de una reserva. Guarda el estado anterior
     * para revertir en caso de error del backend (patrón rollback).
     */
    onEstadoChange(reserva: any, nuevoEstado: string) {
        if (nuevoEstado === reserva.estado) return;
        const estadoAnterior = reserva.estado;
        this.updatingId = reserva.id;
        this.adminService.updateReservation(reserva.id, { estado: nuevoEstado }).subscribe({
            next: () => {
                reserva.estado = nuevoEstado;
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err) => {
                // Se revierte al estado anterior si la actualización falla
                reserva.estado = estadoAnterior;
                this.updatingId = null;
                alert('Error al actualizar el estado: ' + (err.error?.message || 'Error desconocido'));
                this.cdr.detectChanges();
            }
        });
    }

    /** Formatea la etiqueta de estado desde el JSON de traducciones. */
    getEstadoLabel(estado: string): string {
        return this.translate.instant('ADMIN.RESERVATIONS.STATUS_' + estado.toUpperCase());
    }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    /** Confirma la eliminación de la reserva y actualiza la lista local. */
    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteReservation(id).subscribe({
            next: () => {
                this.allReservas = this.allReservas.filter(r => r.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar la reserva: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
