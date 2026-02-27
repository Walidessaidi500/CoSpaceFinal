import { Component, OnInit, ViewChild, ChangeDetectorRef, inject } from '@angular/core';

import { ActivatedRoute, Router } from '@angular/router';
import { EspaciosService } from '../../services/espacios';
import { AdminService } from '../../services/admin.service';
import { FormularioEspacioComponent } from '../formulario-espacio/formulario-espacio.component';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Componente de Edición de Espacio del Administrador
 *
 * Permite al administrador editar los datos de cualquier espacio de la plataforma.
 * Reutiliza el FormularioEspacioComponent para la interfaz del formulario.
 *
 * A diferencia de la edición normal del anfitrión, este componente:
 * - Usa AdminService.updateSpace() en lugar de EspaciosService.updateEspacio()
 * - Permite eliminar el espacio directamente desde la vista de edición
 * - Incluye un modal de confirmación de eliminación
 *
 * El ID del espacio se obtiene del parámetro de ruta.
 */
@Component({
    selector: 'app-espacio-admin-edit',
    standalone: true,
    imports: [SidebarAdminComponent, FormularioEspacioComponent, ConfirmModalComponent, TranslateModule],
    templateUrl: './espacio-admin-edit.component.html',
    styleUrls: ['./espacio-admin-edit.component.css']
})
export class EspacioAdminEditComponent implements OnInit {
    /** Referencia al formulario reutilizable para acceder a sus datos y métodos */
    @ViewChild(FormularioEspacioComponent) formularioComponent!: FormularioEspacioComponent;

    private espaciosService = inject(EspaciosService);
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    /** ID del espacio que se está editando */
    espacioId: string | null = null;
    isLoading = true;
    loadingText = this.translate.instant('ADMIN.SPACES.LOADING_EDIT');
    errorMessage: string | null = null;
    /** ID del espacio que se está eliminando (para estado visual de carga) */
    deletingId: number | null = null;

    // Estado del modal de eliminación
    // Estado del modal de eliminación
    showDeleteModal = false;

    /**
     * Obtiene el ID del espacio de la ruta y carga sus datos.
     * Si no hay ID, redirige al listado de espacios.
     */
    ngOnInit() {
        this.espacioId = this.route.snapshot.paramMap.get('id');
        if (this.espacioId) {
            this.loadEspacioData();
        } else {
            this.router.navigate(['/admin/espacios']);
        }
    }

    /**
     * Carga los datos del espacio y los rellena en el formulario.
     * Usa setTimeout para asegurar que el ViewChild esté disponible.
     */
    loadEspacioData() {
        this.isLoading = true;
        this.loadingText = this.translate.instant('ADMIN.SPACES.LOADING_EDIT');
        if (!this.espacioId) return;

        this.espaciosService.getEspacioById(this.espacioId).subscribe({
            next: (data) => {
                setTimeout(() => {
                    if (this.formularioComponent) {
                        this.formularioComponent.patchData(data);
                    }
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }, 300);
            },
            error: (err) => {
                console.error('Error loading space:', err);
                this.errorMessage = 'No se pudo cargar la información del espacio.';
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Guarda los cambios del espacio usando el servicio de administrador.
     * Valida el formulario antes de enviar.
     */
    onGuardar() {
        if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
            const formData = this.formularioComponent.getFormData();

            if (this.espacioId) {
                this.isLoading = true;
                this.loadingText = this.translate.instant('ADMIN.SPACES.LOADING_EDIT');

                this.adminService.updateSpace(+this.espacioId, formData).subscribe({
                    next: () => {
                        this.handleSuccess();
                    },
                    error: (err) => {
                        console.error('Error updating space:', err);
                        this.errorMessage = 'Error al actualizar el espacio.';
                        this.isLoading = false;
                        this.cdr.detectChanges();
                    }
                });
            }
        } else {
            // Marca todos los campos como tocados para mostrar las validaciones
            this.formularioComponent.espacioForm.markAllAsTouched();
        }
    }

    /** Cancela la edición y redirige al listado de espacios. */
    onCancelar() {
        this.router.navigate(['/admin/espacios']);
    }

    /** Muestra mensaje de éxito y redirige al listado de espacios. */
    private handleSuccess() {
        alert('¡Espacio actualizado correctamente por el Administrador!');
        this.router.navigate(['/admin/espacios']);
    }

    // ========================
    // LÓGICA DE ELIMINACIÓN
    // ========================

    /** Abre el modal de confirmación de eliminación. */
    openDeleteModal() {
        this.showDeleteModal = true;
    }

    /** Cierra el modal de confirmación de eliminación. */
    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    /** Confirma la eliminación del espacio y redirige al listado. */
    confirmDelete() {
        if (!this.espacioId) return;

        const id = +this.espacioId;
        this.deletingId = id;

        this.adminService.deleteSpace(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/espacios']);
            },
            error: (err) => {
                console.error('Error deleting space:', err);
                alert('Error al eliminar el espacio.');
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
