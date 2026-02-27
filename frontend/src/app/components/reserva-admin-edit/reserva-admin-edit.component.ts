import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Edición de Reserva del Administrador
 *
 * Permite al administrador editar los datos de cualquier reserva de la plataforma,
 * incluyendo el monto total y el estado de la reserva.
 *
 * El componente carga los datos de la reserva buscándola en la lista completa
 * de reservas devuelta por la API del administrador. Permite modificar el estado
 * y eliminar la reserva con un modal de confirmación.
 *
 * Tras una actualización exitosa, muestra un mensaje de éxito y redirige
 * al listado de reservas tras 1.5 segundos.
 */
@Component({
    selector: 'app-reserva-admin-edit',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, ReactiveFormsModule, ConfirmModalComponent, TranslateModule],
    templateUrl: './reserva-admin-edit.component.html',
    styleUrls: ['./reserva-admin-edit.component.css']
})
export class ReservaAdminEditComponent implements OnInit {
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    /** Formulario reactivo con los campos editables de la reserva */
    reservaForm: FormGroup;
    /** ID de la reserva que se está editando */
    reservaId: number | null = null;
    isLoading = true;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    deletingId: number | null = null;

    // Estado del modal de eliminación
    showDeleteModal = false;

    /** Inicializa el formulario con validaciones de monto mínimo y estado obligatorio. */
    constructor() {
        this.reservaForm = this.fb.group({
            monto_total: ['', [Validators.required, Validators.min(0)]],
            estado: ['', [Validators.required]]
        });
    }

    /**
     * Obtiene el ID de la reserva de la ruta y carga sus datos.
     * Si no hay ID, redirige al listado de reservas.
     */
    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.reservaId = +id;
            this.loadReservaData(this.reservaId);
        } else {
            this.router.navigate(['/admin/reservas']);
        }
    }

    /**
     * Carga los datos de la reserva buscándola en la lista completa.
     * Este enfoque se usa porque la API no tiene un endpoint individual por ID.
     */
    loadReservaData(id: number) {
        this.isLoading = true;
        this.adminService.getAllReservations().subscribe({
            next: (reservas: any[]) => {
                const reserva = reservas.find(r => r.id === id);
                if (reserva) {
                    this.reservaForm.patchValue({
                        monto_total: reserva.monto_total,
                        estado: reserva.estado
                    });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } else {
                    this.errorMessage = this.translate.instant('ADMIN.RESERVATIONS_EDIT.ERROR_NOT_FOUND');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error loading reservations:', err);
                this.errorMessage = this.translate.instant('ADMIN.RESERVATIONS_EDIT.ERROR_LOAD');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Envía los cambios de la reserva al backend.
     * Tras la actualización exitosa, redirige al listado de reservas.
     */
    onSubmit() {
        if (this.reservaForm.valid && this.reservaId) {
            this.isLoading = true;
            this.errorMessage = null;

            this.adminService.updateReservation(this.reservaId, this.reservaForm.value).subscribe({
                next: () => {
                    this.successMessage = this.translate.instant('ADMIN.RESERVATIONS_EDIT.SUCCESS');
                    setTimeout(() => {
                        this.router.navigate(['/admin/reservas']);
                    }, 1500);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error updating reservation:', err);
                    this.errorMessage = 'Error al actualizar la reserva: ' + (err.error?.message || err.message);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            this.reservaForm.markAllAsTouched();
        }
    }

    /** Cancela la edición y redirige al listado de reservas. */
    onCancel() {
        this.router.navigate(['/admin/reservas']);
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

    /** Confirma la eliminación de la reserva y redirige al listado. */
    confirmDelete() {
        if (!this.reservaId) return;

        const id = this.reservaId;
        this.deletingId = id;

        this.adminService.deleteReservation(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/reservas']);
            },
            error: (err) => {
                console.error('Error deleting reservation:', err);
                alert('Error al eliminar la reserva: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
