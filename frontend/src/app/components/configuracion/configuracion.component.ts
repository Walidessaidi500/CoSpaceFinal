import { Component, inject, OnInit } from '@angular/core';

import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { ThemeService } from '../../services/theme.service';
import { LanguageService } from '../../services/language.service';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { environment } from '../../../environments/enviroments';

/**
 * Componente de Configuración del Usuario
 *
 * Permite al usuario gestionar su perfil personal y las preferencias de la cuenta.
 * Incluye las siguientes secciones:
 *
 * 1. **Perfil**: Edición de nombre, email, teléfono y foto de perfil.
 * 2. **Apariencia**: Modo oscuro (ThemeService) e idioma (LanguageService).
 * 3. **Seguridad**: Activar/desactivar autenticación de dos factores (2FA)
 *    y cambio de contraseña mediante modal.
 *
 * Se utiliza un enfoque de actualización optimista para el toggle de 2FA,
 * revirtiendo el cambio si la petición al backend falla.
 */
@Component({
    selector: 'app-configuracion',
    standalone: true,
    imports: [ReactiveFormsModule, TranslateModule],
    templateUrl: './configuracion.component.html',
})
export class ConfiguracionComponent implements OnInit {
    // Inyección de dependencias
    private fb = inject(FormBuilder);
    private authService = inject(AuthService);
    /** Servicio de tema visual (público para uso en template) */
    public themeService = inject(ThemeService);
    /** Servicio de idioma (público para uso en template) */
    public languageService = inject(LanguageService);
    private translate = inject(TranslateService);

    /** Datos del usuario autenticado, obtenidos del servicio de autenticación */
    user = this.authService.getUser();

    /** Formulario reactivo para la edición del perfil de usuario */
    profileForm = this.fb.group({
        nombre_completo: ['', [Validators.required]],
        email: ['', [Validators.required, Validators.email]],
        telefono: [''],
        biografia: ['']
    });

    // Estado de las opciones de accesibilidad (reservado para futuras implementaciones)
    highContrast = false;
    notifications = true;

    /** URL de la imagen de perfil para previsualización antes de subir */
    profilePictureUrl: string | ArrayBuffer | null = null;
    /** Archivo seleccionado por el usuario para la nueva foto de perfil */
    selectedFile: File | null = null;

    /**
     * Inicializa el formulario con los datos del usuario actual.
     * Si tiene foto de perfil, construye la URL completa para previsualización.
     */
    ngOnInit() {
        if (this.user) {
            this.profileForm.patchValue({
                nombre_completo: this.user.nombre_completo,
                email: this.user.email,
                telefono: this.user.telefono || '',
                biografia: this.user.anfitrion?.biografia || this.user.biografia || ''
            });

            if (this.user.foto_perfil) {
                // Se construye la URL completa hacia el almacenamiento del backend
                this.profilePictureUrl = `${environment.baseUrl}/storage/${this.user.foto_perfil}`;
            }
        }
    }

    /**
     * Maneja la selección de un archivo de imagen para la foto de perfil.
     * Usa FileReader para generar una previsualización inmediata de la imagen seleccionada.
     */
    onFileSelected(event: any) {
        const file: File = event.target.files[0];
        if (file) {
            this.selectedFile = file;
            const reader = new FileReader();
            reader.onload = (e) => {
                this.profilePictureUrl = e.target?.result || null;
            };
            reader.readAsDataURL(file);
        }
    }

    /** Indicador de carga para peticiones en curso */
    isLoading = false;
    /** Controla la visibilidad del toast de éxito */
    showSuccessToast = false;

    /**
     * Guarda los cambios del perfil del usuario.
     * Envía los datos mediante FormData para soportar la subida de archivos (foto de perfil).
     * Al tener éxito, muestra un toast durante 4 segundos y actualiza los datos locales del usuario.
     */
    saveProfile() {
        if (this.profileForm.valid) {
            this.isLoading = true;
            this.showSuccessToast = false;

            // Se usa FormData para poder enviar tanto campos de texto como la foto
            const formData = new FormData();
            formData.append('nombre_completo', this.profileForm.get('nombre_completo')?.value || '');
            formData.append('email', this.profileForm.get('email')?.value || '');
            formData.append('telefono', this.profileForm.get('telefono')?.value || '');

            if (this.user.tipo_usuario === 'Anfitrion') {
                formData.append('biografia', this.profileForm.get('biografia')?.value || '');
            }

            if (this.selectedFile) {
                formData.append('foto_perfil', this.selectedFile);
            }

            this.authService.updateProfile(formData).subscribe({
                next: (res) => {
                    this.isLoading = false;
                    this.showSuccessToast = true;
                    // Se oculta el toast de éxito tras 4 segundos
                    setTimeout(() => {
                        this.showSuccessToast = false;
                    }, 4000);

                    this.selectedFile = null;
                    // Se recargan los datos del usuario desde el servicio
                    this.user = this.authService.getUser();
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Error updating profile:', err);
                    alert(this.translate.instant('SETTINGS.ERRORS.UPDATE_PROFILE') + ': ' + (err.error?.message || err.message));
                }
            });
        }
    }

    /** Cierra el toast de éxito manualmente. */
    closeToast() {
        this.showSuccessToast = false;
    }

    /** Alterna el modo oscuro de la aplicación a través del servicio de tema. */
    toggleDarkMode() {
        this.themeService.toggleDarkMode();
    }

    /** Cambia el idioma de la aplicación a través del servicio de idiomas. */
    toggleLanguage(lang: string) {
        this.languageService.setLanguage(lang);
    }

    /**
     * Activa o desactiva la autenticación de dos factores (2FA).
     * Utiliza una actualización optimista: cambia el estado local inmediatamente
     * y lo revierte si la petición al backend falla.
     */
    toggle2FA() {
        if (!this.user) return;
        const newState = !this.user.two_factor_enabled;

        // Actualización optimista: se cambia el estado local antes de esperar la respuesta
        this.user.two_factor_enabled = newState;

        this.authService.update2FASettings(newState).subscribe({
            next: (res) => {
                this.showSuccessToast = true;
                setTimeout(() => this.showSuccessToast = false, 3000);
            },
            error: (err) => {
                // Se revierte el cambio optimista en caso de error
                if (this.user) this.user.two_factor_enabled = !newState;
                console.error(err);
                alert(this.translate.instant('SETTINGS.ERRORS.UPDATE_2FA'));
            }
        });
    }

    // ========================
    // MODAL DE CAMBIO DE CONTRASEÑA
    // ========================

    /** Controla la visibilidad del modal de cambio de contraseña */
    showChangePasswordModal = false;

    /** Formulario reactivo para el cambio de contraseña con validaciones */
    changePasswordForm = this.fb.group({
        current_password: ['', Validators.required],
        new_password: ['', [Validators.required, Validators.minLength(8)]],
        confirm_password: ['', Validators.required]
    });

    /** Mensaje de error del formulario de contraseña */
    passwordError = '';
    /** Mensaje de éxito del formulario de contraseña */
    passwordSuccess = '';

    /** Abre el modal de cambio de contraseña y resetea el formulario. */
    openPasswordModal() {
        this.showChangePasswordModal = true;
        this.changePasswordForm.reset();
        this.passwordError = '';
        this.passwordSuccess = '';
    }

    /** Cierra el modal de cambio de contraseña. */
    closePasswordModal() {
        this.showChangePasswordModal = false;
    }

    /**
     * Envía la petición de cambio de contraseña al backend.
     * Valida que las contraseñas coincidan antes de enviar.
     * El campo 'new_password_confirmation' sigue la convención de Laravel para la regla 'confirmed'.
     */
    submitChangePassword() {
        if (this.changePasswordForm.invalid) return;

        const { current_password, new_password, confirm_password } = this.changePasswordForm.value;

        // Se verifica que las contraseñas coincidan antes de enviar
        if (new_password !== confirm_password) {
            this.passwordError = this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.ERROR_MATCH');
            return;
        }

        this.isLoading = true;
        this.passwordError = '';

        this.authService.changePassword({
            current_password: current_password,
            new_password: new_password,
            // Laravel busca el campo con sufijo '_confirmation' para la regla de validación 'confirmed'
            new_password_confirmation: confirm_password
        }).subscribe({
            next: (res) => {
                this.isLoading = false;
                this.passwordSuccess = this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.SUCCESS');
                setTimeout(() => {
                    this.closePasswordModal();
                }, 2000);
            },
            error: (err) => {
                this.isLoading = false;
                this.passwordError = err.error?.message || this.translate.instant('SETTINGS.MODALS.CHANGE_PASSWORD.ERROR_GENERIC');
            }
        });
    }
}
