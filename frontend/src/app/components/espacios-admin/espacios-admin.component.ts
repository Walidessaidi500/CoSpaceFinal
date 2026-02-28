import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Gestión de Espacios del Administrador
 *
 * Muestra un listado de todos los espacios registrados en la plataforma con
 * funcionalidades de búsqueda, filtrado y eliminación.
 *
 * Características:
 * - **Búsqueda**: Por título, ciudad o nombre del anfitrión.
 * - **Filtrado**: Por estado del espacio (Disponible, Mantenimiento, etc.).
 * - **Eliminación**: Con modal de confirmación para prevenir acciones accidentales.
 * - **Navegación**: Enlace a la vista de edición individual de cada espacio.
 *
 * Utiliza el ConfirmModalComponent reutilizable para las confirmaciones de eliminación.
 */
@Component({
    selector: 'app-espacios-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './espacios-admin.component.html',
    styleUrls: ['./espacios-admin.component.css'],
})
export class EspaciosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    /** Lista completa de espacios sin filtrar (fuente de datos original) */
    allEspacios: any[] = [];
    /** Lista de espacios visible tras aplicar los filtros */
    espacios: any[] = [];
    /** Indicador de estado de carga */
    isLoading = true;
    /** Mensaje de error si falla la carga */
    errorMessage: string | null = null;
    /** ID del espacio que se está eliminando actualmente */
    deletingId: number | null = null;

    // Filtros de búsqueda
    searchTerm = '';
    filterEstado = '';

    // Estado del modal de eliminación
    showDeleteModal = false;
    itemToDeleteId: number | null = null;

    /** Carga los espacios al inicializar el componente. */
    ngOnInit() { this.loadEspacios(); }

    /** Obtiene todos los espacios desde la API del administrador. */
    loadEspacios() {
        this.isLoading = true;
        this.adminService.getAllSpaces().subscribe({
            next: (data) => {
                this.allEspacios = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar los espacios. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Aplica los filtros de búsqueda y estado sobre la lista completa de espacios.
     * Los filtros son acumulativos: el espacio debe cumplir ambos criterios.
     */
    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.espacios = this.allEspacios.filter(e => {
            const matchSearch = !term ||
                e.titulo?.toLowerCase().includes(term) ||
                e.ciudad?.toLowerCase().includes(term) ||
                e.anfitrion?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || e.estado === this.filterEstado;
            return matchSearch && matchEstado;
        });
    }

    /** Re-aplica filtros cuando cambia el término de búsqueda. */
    onSearchChange() { this.applyFilters(); }
    /** Re-aplica filtros cuando cambia el estado seleccionado. */
    onFilterChange() { this.applyFilters(); }

    /** Limpia todos los filtros y muestra la lista completa. */
    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.applyFilters();
    }

    /** Número de espacios tras aplicar filtros */
    get totalFiltrados() { return this.espacios.length; }
    /** Número total de espacios sin filtrar */
    get totalEspacios() { return this.allEspacios.length; }

    /** Abre el modal de confirmación de eliminación para un espacio. */
    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    /** Cierra el modal de confirmación de eliminación. */
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    /**
     * Confirma la eliminación del espacio seleccionado.
     * Actualiza la lista local tras la eliminación exitosa sin recargar desde el servidor.
     */
    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteSpace(id).subscribe({
            next: () => {
                this.allEspacios = this.allEspacios.filter(e => e.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar el espacio: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
