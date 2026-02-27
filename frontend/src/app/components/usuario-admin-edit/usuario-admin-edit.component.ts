import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { AdminService } from '../../services/admin.service';
import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { ConfirmModalComponent } from '../shared/confirm-modal/confirm-modal.component';

/**
 * Componente de Edición de Usuario del Administrador
 *
 * Permite al administrador editar los datos de cualquier usuario de la plataforma,
 * incluyendo nombre, email y rol (tipo de usuario).
 *
 * El usuario se carga obteniendo la lista completa de usuarios y filtrando
 * por el ID del parámetro de ruta. También permite eliminar el usuario
 * directamente desde la vista de edición con un modal de confirmación.
 *
 * Tras una actualización exitosa, muestra un mensaje de éxito y redirige
 * al listado de usuarios tras 1.5 segundos.
 */
@Component({
    selector: 'app-usuario-admin-edit',
    standalone: true,
    imports: [CommonModule, SidebarAdminComponent, ReactiveFormsModule, ConfirmModalComponent, TranslateModule],
    templateUrl: './usuario-admin-edit.component.html',
    styleUrls: ['./usuario-admin-edit.component.css']
})
export class UsuarioAdminEditComponent implements OnInit {
    private adminService = inject(AdminService);
    private route = inject(ActivatedRoute);
    private router = inject(Router);
    private fb = inject(FormBuilder);
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    /** Formulario reactivo con los campos editables del usuario */
    userForm: FormGroup;
    /** ID del usuario que se está editando */
    userId: number | null = null;
    isLoading = true;
    errorMessage: string | null = null;
    successMessage: string | null = null;
    deletingId: number | null = null;

    // Estado del modal de eliminación
    showDeleteModal = false;

    /** Inicializa el formulario reactivo con las validaciones necesarias. */
    constructor() {
        this.userForm = this.fb.group({
            nombre_completo: ['', [Validators.required, Validators.minLength(3)]],
            email: ['', [Validators.required, Validators.email]],
            tipo_usuario: ['', [Validators.required]]
        });
    }

    /**
     * Obtiene el ID del usuario de la ruta y carga sus datos.
     * Si no hay ID, redirige al listado de usuarios.
     */
    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id');
        if (id) {
            this.userId = +id;
            this.loadUserData(this.userId);
        } else {
            this.router.navigate(['/admin/usuarios']);
        }
    }

    /**
     * Carga los datos del usuario buscándolo en la lista completa de usuarios.
     * Este enfoque se usa porque la API del administrador no tiene
     * un endpoint individual de usuario por ID.
     */
    loadUserData(id: number) {
        this.isLoading = true;
        this.adminService.getAllUsers().subscribe({
            next: (users: any[]) => {
                const user = users.find(u => u.id === id);
                if (user) {
                    // Se rellenan los campos del formulario con los datos del usuario encontrado
                    this.userForm.patchValue({
                        nombre_completo: user.nombre,
                        email: user.email,
                        tipo_usuario: user.rol
                    });
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } else {
                    this.errorMessage = this.translate.instant('ADMIN.USERS.ERROR_NOT_FOUND');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                console.error('Error loading users:', err);
                this.errorMessage = this.translate.instant('ADMIN.USERS.ERROR_EDIT');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }

    /**
     * Envía los cambios del usuario al backend.
     * Tras la actualización exitosa, muestra un mensaje de éxito
     * y redirige al listado de usuarios tras 1.5 segundos.
     */
    onSubmit() {
        if (this.userForm.valid && this.userId) {
            this.isLoading = true;
            this.errorMessage = null;

            this.adminService.updateUser(this.userId, this.userForm.value).subscribe({
                next: () => {
                    this.successMessage = this.translate.instant('ADMIN.USERS.SUCCESS_EDIT');
                    setTimeout(() => {
                        this.router.navigate(['/admin/usuarios']);
                    }, 1500);
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error updating user:', err);
                    this.errorMessage = 'Error al actualizar el usuario: ' + (err.error?.message || err.message);
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            });
        } else {
            // Marca todos los campos como tocados para mostrar las validaciones
            this.userForm.markAllAsTouched();
        }
    }

    /** Cancela la edición y redirige al listado de usuarios. */
    onCancel() {
        this.router.navigate(['/admin/usuarios']);
    }

    // ========================
    // LÓGICA DE ELIMINACIÓN
    // ========================

    /** Abre el modal de confirmación de eliminación. */
    initiateDelete() {
        this.showDeleteModal = true;
    }

    /** Cierra el modal de confirmación de eliminación. */
    closeDeleteModal() {
        this.showDeleteModal = false;
    }

    /** Confirma la eliminación del usuario y redirige al listado. */
    confirmDelete() {
        if (!this.userId) return;

        const id = this.userId;
        this.deletingId = id;

        this.adminService.deleteUser(id).subscribe({
            next: () => {
                this.deletingId = null;
                this.closeDeleteModal();
                this.router.navigate(['/admin/usuarios']);
            },
            error: (err) => {
                console.error('Error deleting user:', err);
                alert('Error al eliminar el usuario: ' + (err.error?.message || 'Error desconocido'));
                this.deletingId = null;
                this.closeDeleteModal();
                this.cdr.detectChanges();
            }
        });
    }
}
