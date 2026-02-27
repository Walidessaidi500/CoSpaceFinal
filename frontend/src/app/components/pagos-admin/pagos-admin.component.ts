import { Component, OnInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Gestión de Pagos del Administrador
 *
 * Muestra un listado de todos los pagos realizados en la plataforma con
 * funcionalidades de búsqueda, filtrado y eliminación. Implementa un sistema
 * de polling cada 10 segundos para mantener los datos actualizados en tiempo real.
 *
 * Características:
 * - **Búsqueda**: Por nombre del cliente, email, nombre del espacio o ID de transacción.
 * - **Filtrado**: Por estado del pago (Completado, Pendiente, Fallido, Reembolsado) y método de pago.
 * - **Estadísticas**: Calcula ingresos totales (comisión del 14.59%), pagos completados y reembolsados.
 * - **Eliminación**: Con modal de confirmación reutilizable.
 * - **Polling**: Refresco silencioso cada 10 segundos sin indicador de carga visual.
 *
 * Los ingresos se calculan como el 14.59% de comisión sobre el monto bruto de pagos completados.
 */
@Component({
    selector: 'app-pagos-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './pagos-admin.component.html',
    styleUrls: ['./pagos-admin.component.css'],
})
export class PagosAdminComponent implements OnInit, OnDestroy {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    /** Lista completa de pagos sin filtrar */
    allPagos: any[] = [];
    /** Lista de pagos visible tras aplicar filtros */
    pagos: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterEstado = '';
    filterMetodo = '';

    // Estado del modal de eliminación
    showDeleteModal = false;
    itemToDeleteId: number | null = null;
    modalTitle = 'Eliminar Registro de Pago';
    modalMessage = '¿Estás seguro de que deseas eliminar este registro de pago? Esta acción no se puede deshacer.';

    /** Tasa de comisión de la plataforma: 14.59% sobre el monto bruto */
    private readonly COMMISSION_RATE = 0.1459;

    // ========================
    // ESTADÍSTICAS CALCULADAS
    // ========================

    /** Calcula los ingresos totales de la plataforma como comisión sobre pagos completados */
    get totalIngresos(): number {
        const totalBruto = this.allPagos
            .filter(p => p.estado_pago === 'Completado')
            .reduce((sum, p) => sum + Number(p.monto || 0), 0);
        return totalBruto * this.COMMISSION_RATE;
    }

    /** Número total de pagos con estado 'Completado' */
    get totalCompletados(): number {
        return this.allPagos.filter(p => p.estado_pago === 'Completado').length;
    }

    /** Número total de pagos con estado 'Reembolsado' */
    get totalReembolsados(): number {
        return this.allPagos.filter(p => p.estado_pago === 'Reembolsado').length;
    }

    /** Referencia al intervalo de polling para limpiarlo al destruir el componente */
    private pollingInterval: any = null;

    /**
     * Carga inicial de pagos y configuración del polling cada 10 segundos
     * para mantener los datos actualizados en tiempo real.
     */
    ngOnInit() {
        this.loadPagos();
        // Polling silencioso cada 10 segundos
        this.pollingInterval = setInterval(() => {
            this.refreshPagos();
        }, 10000);
    }

    /** Limpia el intervalo de polling para evitar fugas de memoria. */
    ngOnDestroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /** Carga inicial de pagos con indicador de carga visible. */
    loadPagos() {
        this.isLoading = true;
        this.errorMessage = null;
        this.fetchPagos();
    }

    /** Refresco silencioso de pagos sin indicador de carga (para el polling). */
    refreshPagos() {
        this.fetchPagos();
    }

    /** Realiza la petición HTTP para obtener todos los pagos. */
    private fetchPagos() {
        this.adminService.getAllPagos().subscribe({
            next: (data: any) => {
                this.allPagos = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                this.errorMessage = 'Error al cargar los pagos. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /** Aplica filtros de búsqueda, estado y método de pago. */
    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.pagos = this.allPagos.filter(p => {
            const matchSearch = !term ||
                p.cliente?.toLowerCase().includes(term) ||
                p.email?.toLowerCase().includes(term) ||
                p.espacio?.toLowerCase().includes(term) ||
                p.id_transaccion?.toLowerCase().includes(term);
            const matchEstado = !this.filterEstado || p.estado_pago === this.filterEstado;
            const matchMetodo = !this.filterMetodo || p.metodo_pago === this.filterMetodo;
            return matchSearch && matchEstado && matchMetodo;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterEstado = '';
        this.filterMetodo = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.pagos.length; }
    get totalPagos() { return this.allPagos.length; }

    /**
     * Devuelve las clases CSS de Tailwind correspondientes al estado del pago
     * para aplicar estilos de color diferenciados.
     */
    getEstadoClasses(estado: string): string {
        const map: { [k: string]: string } = {
            'Completado': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300',
            'Pendiente': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300',
            'Fallido': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300',
            'Reembolsado': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300',
        };
        return map[estado] || 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }

    openDeleteModal(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    /** Confirma la eliminación del pago y actualiza la lista local. */
    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deletePago(id).subscribe({
            next: () => {
                this.allPagos = this.allPagos.filter(p => p.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err: any) => {
                alert('Error al eliminar el pago: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
