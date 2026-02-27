import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Gestión de Reportes del Administrador
 *
 * Muestra un listado de todos los reportes de usuarios sobre espacios de la plataforma.
 * Los reportes son quejas o denuncias que los clientes pueden enviar sobre los espacios.
 *
 * Características:
 * - **Búsqueda**: Por nombre del espacio, usuario, email o descripción del reporte.
 * - **Filtrado**: Por estado (Pendiente, Revisado, Resuelto) y por motivo del reporte.
 * - **Cambio de estado**: El administrador puede cambiar el estado del reporte.
 * - **Contactar usuario**: Abre el cliente de email con un template pre-rellenado.
 * - **Eliminación**: Con modal de confirmación reutilizable.
 *
 * Los motivos de reporte se mapean a etiquetas legibles en español mediante un diccionario.
 */
@Component({
    selector: 'app-reportes-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, SidebarAdminComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './reportes-admin.component.html',
    styleUrls: ['./reportes-admin.component.css'],
})
export class ReportesAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    /** Lista completa de reportes sin filtrar */
    allReportes: any[] = [];
    /** Lista de reportes visible tras aplicar filtros */
    reportes: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;
    /** ID del reporte cuyo estado se está actualizando */
    updatingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';
    filterMotivo = '';

    // Estado del modal de eliminación
    showDeleteModal = false;
    itemToDeleteId: number | null = null;

    /** Diccionario de mapeo de claves de motivo a etiquetas legibles en español */
    motivosMap: { [key: string]: string } = {
        'reserva_fraudulenta': 'Reserva fraudulenta',
        'contenido_inapropiado': 'Contenido inapropiado',
        'informacion_falsa': 'Información falsa',
        'espacio_inseguro': 'Espacio inseguro',
        'incumplimiento_normas': 'Incumplimiento de normas',
        'otro': 'Otro motivo'
    };

    ngOnInit() { this.loadReportes(); }

    /** Obtiene todos los reportes desde la API del administrador. */
    loadReportes() {
        this.isLoading = true;
        this.errorMessage = null;
        this.adminService.getAllReportes().subscribe({
            next: (data: any) => {
                this.allReportes = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.errorMessage = 'Error al cargar los reportes. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /** Aplica filtros de búsqueda, estado y motivo sobre la lista de reportes. */
    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.reportes = this.allReportes.filter(r => {
            const matchSearch = !term ||
                r.espacio?.toLowerCase().includes(term) ||
                r.usuario?.toLowerCase().includes(term) ||
                r.usuario_email?.toLowerCase().includes(term) ||
                r.descripcion?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || r.estado === this.filterEstado;
            const matchMotivo = !this.filterMotivo || r.motivo === this.filterMotivo;
            return matchSearch && matchEstado && matchMotivo;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.filterMotivo = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.reportes.length; }
    get totalReportes() { return this.allReportes.length; }

    /** Obtiene la etiqueta legible en español para un motivo de reporte. */
    getMotivoLabel(motivo: string): string { return this.motivosMap[motivo] || motivo; }

    /**
     * Abre el cliente de correo del sistema con un email pre-rellenado
     * para contactar al usuario que realizó el reporte.
     */
    contactarUsuario(email: string, nombreEspacio: string) {
        const subject = encodeURIComponent(`Re: Tu reporte sobre "${nombreEspacio}" - CoSpace`);
        const body = encodeURIComponent(
            `Hola,\n\nNos ponemos en contacto contigo en relación a tu reporte sobre el espacio "${nombreEspacio}" en CoSpace.\n\n`
        );
        window.open(`mailto:${email}?subject=${subject}&body=${body}`, '_blank');
    }

    /** Cambia el estado de un reporte (Pendiente → Revisado → Resuelto). */
    cambiarEstado(id: number, nuevoEstado: string) {
        this.updatingId = id;
        this.adminService.updateReporteEstado(id, nuevoEstado).subscribe({
            next: () => {
                const reporte = this.allReportes.find(r => r.id === id);
                if (reporte) reporte.estado = nuevoEstado;
                this.applyFilters();
                this.updatingId = null;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                alert('Error al actualizar el estado: ' + (err.error?.message || 'Error desconocido'));
                this.updatingId = null;
                this.cdr.detectChanges();
            }
        });
    }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    /** Confirma la eliminación del reporte y actualiza la lista local. */
    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteReporte(id).subscribe({
            next: () => {
                this.allReportes = this.allReportes.filter(r => r.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                alert('Error al eliminar el reporte: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
