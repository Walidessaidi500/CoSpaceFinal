import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Gestión de Usuarios del Administrador
 *
 * Muestra un listado de todos los usuarios registrados en la plataforma con
 * funcionalidades de búsqueda, filtrado, eliminación y gestión de estado de cuenta.
 *
 * Características:
 * - **Búsqueda**: Por nombre o email del usuario.
 * - **Filtrado**: Por rol (Cliente, Anfitrion, Admin).
 * - **Eliminación**: Con modal de confirmación reutilizable.
 * - **Toggle de estado**: Permite suspender o reactivar cuentas de usuario.
 * - **Navegación**: Enlace a la vista de edición individual de cada usuario.
 */
@Component({
    selector: 'app-usuarios-admin',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink, SidebarAdminComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './usuarios-admin.component.html',
    styleUrls: ['./usuarios-admin.component.css'],
})
export class UsuariosAdminComponent implements OnInit {
    private adminService = inject(AdminService);
    private cdr = inject(ChangeDetectorRef);

    /** Lista completa de usuarios sin filtrar */
    allUsuarios: any[] = [];
    /** Lista de usuarios visible tras aplicar los filtros */
    usuarios: any[] = [];
    isLoading = true;
    errorMessage: string | null = null;
    deletingId: number | null = null;

    // Filtros
    searchTerm = '';
    filterRol = '';

    // Estado del modal de eliminación
    showDeleteModal = false;
    itemToDeleteId: number | null = null;

    ngOnInit() { this.loadUsuarios(); }

    /** Obtiene todos los usuarios desde la API del administrador. */
    loadUsuarios() {
        this.isLoading = true;
        this.adminService.getAllUsers().subscribe({
            next: (data) => {
                this.allUsuarios = data;
                this.applyFilters();
                this.isLoading = false;
                this.cdr.detectChanges();
            },
            error: (err) => {
                this.errorMessage = 'Error al cargar los usuarios. ' + (err.message || '');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /** Aplica filtros de búsqueda y rol sobre la lista de usuarios. */
    applyFilters() {
        const term = this.searchTerm.toLowerCase().trim();
        this.usuarios = this.allUsuarios.filter(u => {
            const matchSearch = !term ||
                u.nombre?.toLowerCase().includes(term) ||
                u.email?.toLowerCase().includes(term);
            const matchRol = !this.filterRol || u.rol === this.filterRol;
            return matchSearch && matchRol;
        });
    }

    onSearchChange() { this.applyFilters(); }
    onFilterChange() { this.applyFilters(); }

    clearFilters() {
        this.searchTerm = '';
        this.filterRol = '';
        this.applyFilters();
    }

    get totalFiltrados() { return this.usuarios.length; }
    get totalUsuarios() { return this.allUsuarios.length; }

    /** Abre el modal de confirmación para eliminar un usuario. */
    initiateDelete(id: number) { this.itemToDeleteId = id; this.showDeleteModal = true; }
    closeDeleteModal() { this.showDeleteModal = false; this.itemToDeleteId = null; }

    /** Confirma la eliminación del usuario y actualiza la lista local. */
    confirmDelete() {
        if (this.itemToDeleteId === null) return;
        const id = this.itemToDeleteId;
        this.deletingId = id;
        this.adminService.deleteUser(id).subscribe({
            next: () => {
                this.allUsuarios = this.allUsuarios.filter(u => u.id !== id);
                this.applyFilters();
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al eliminar el usuario: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Alterna el estado de la cuenta del usuario entre 'Activo' y 'Suspendido'.
     * Envía la actualización al backend y refleja el cambio en la interfaz.
     * El campo tipo_usuario es obligatorio en la validación del backend.
     */
    toggleEstado(user: any) {
        const newEstado = user.estado_cuenta === 'Suspendido' ? 'Activo' : 'Suspendido';
        const updatedData = {
            estado_cuenta: newEstado,
            tipo_usuario: user.rol // Campo obligatorio en la validación del backend
        };

        this.adminService.updateUser(user.id, updatedData).subscribe({
            next: (res) => {
                user.estado_cuenta = newEstado;
                this.cdr.detectChanges();
            },
            error: (err) => {
                alert('Error al cambiar el estado del usuario: ' + (err.error?.message || 'Error desconocido'));
            }
        });
    }
}
