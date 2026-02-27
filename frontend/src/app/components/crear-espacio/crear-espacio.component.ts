import { Component, ViewChild, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';

import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { FormularioEspacioComponent } from '../formulario-espacio/formulario-espacio.component';
import { FooterAccionesComponent } from '../footer-acciones/footer-acciones.component';
import { EspaciosService } from '../../services/espacios';

/**
 * Componente de Creación/Edición de Espacios del Anfitrión
 *
 * Gestiona tanto la creación de nuevos espacios como la edición de espacios existentes.
 * El modo se determina automáticamente según la presencia de un ID en la ruta:
 *
 * - **Sin ID**: Modo creación → publica un nuevo espacio.
 * - **Con ID**: Modo edición → carga los datos existentes y permite modificarlos.
 *
 * Utiliza el componente FormularioEspacioComponent como formulario reutilizable,
 * accediendo a él mediante @ViewChild para obtener los datos del formulario
 * y pre-rellenarlo en modo edición.
 *
 * Incluye un sistema de notificaciones toast para informar al usuario sobre
 * el resultado de las operaciones (éxito o error).
 */
@Component({
  selector: 'app-crear-espacio',
  standalone: true,
  imports: [
    CommonModule,
    SidebarAnfitrionComponent,
    FormularioEspacioComponent,
    FooterAccionesComponent
  ],
  templateUrl: './crear-espacio.component.html'
})
export class CrearEspacioComponent implements OnInit {
  /** Referencia al componente de formulario para acceder a sus datos y métodos */
  @ViewChild(FormularioEspacioComponent) formularioComponent!: FormularioEspacioComponent;

  /** Indica si el formulario está en modo edición (true) o creación (false) */
  isEditMode = false;
  /** Indicador de estado de carga general */
  isLoading = true;
  /** Texto descriptivo del estado de carga actual */
  loadingText = 'Cargando información...';

  // Estado del toast de notificación
  showToast = false;
  toastMessage = '';
  toastType: 'success' | 'error' = 'success';

  /** ID del espacio a editar (null en modo creación) */
  espacioId: string | null = null;

  constructor(
    private espaciosService: EspaciosService,
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef
  ) { }

  /**
   * Determina el modo (creación/edición) según el parámetro de ruta.
   * En modo edición, carga los datos del espacio existente y los rellena en el formulario.
   */
  ngOnInit() {
    this.espacioId = this.route.snapshot.paramMap.get('id');
    if (this.espacioId) {
      this.isEditMode = true;
      this.isLoading = true;
      this.loadingText = 'Cargando información...';

      // Se obtienen los datos del espacio existente para pre-rellenar el formulario
      this.espaciosService.getEspacioById(this.espacioId).subscribe({
        next: (data) => {
          // Se usa setTimeout para asegurar que la vista esté lista antes de actualizar el formulario
          setTimeout(() => {
            try {
              if (this.formularioComponent) {
                this.formularioComponent.patchData(data);
              }
            } catch (error) {
              console.error('Error updating form data:', error);
            } finally {
              this.isLoading = false;
              this.cdr.detectChanges();
            }
          }, 300);
        },
        error: (err) => {
          console.error(err);
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });
    } else {
      this.isLoading = false;
    }
  }

  /**
   * Guarda el espacio (creación o actualización según el modo).
   * Valida el formulario antes de enviar y muestra notificaciones
   * toast según el resultado de la operación.
   */
  onGuardar() {
    if (this.formularioComponent && this.formularioComponent.espacioForm.valid) {
      const formData = this.formularioComponent.getFormData();

      this.isLoading = true;
      this.loadingText = this.isEditMode ? 'Guardando cambios...' : 'Publicando área...';

      if (this.isEditMode && this.espacioId) {
        // Modo edición: actualizar espacio existente
        this.espaciosService.updateEspacio(this.espacioId, formData).subscribe({
          next: () => {
            this.handleSuccess('¡Espacio actualizado correctamente!');
          },
          error: (err: any) => this.handleError(err)
        });
      } else {
        // Modo creación: publicar nuevo espacio
        this.espaciosService.crearEspacio(formData).subscribe({
          next: () => {
            this.handleSuccess('¡Espacio creado correctamente!');
          },
          error: (err: any) => this.handleError(err)
        });
      }
    } else {
      // Si el formulario no es válido, se marcan todos los campos como tocados
      if (this.formularioComponent) {
        this.formularioComponent.espacioForm.markAllAsTouched();
      }
      this.showToastNotification('Por favor, revisa los campos obligatorios.', 'error');
    }
  }

  /**
   * Maneja el éxito de la operación: muestra toast y redirige a mis áreas.
   */
  private handleSuccess(message: string) {
    this.isLoading = false;
    this.showToastNotification(message, 'success');

    // Se espera 2 segundos para que el usuario vea el toast antes de redirigir
    setTimeout(() => {
      this.router.navigate(['/anfitrion/mis-areas']);
    }, 2000);
  }

  /** Maneja el error de la operación: muestra toast con el mensaje de error. */
  private handleError(err: any) {
    this.isLoading = false;
    this.showToastNotification('Error: ' + (err.message || 'Ocurrió un error inesperado'), 'error');
  }

  /**
   * Muestra una notificación toast con el mensaje y tipo indicados.
   * Las notificaciones de error se auto-ocultan tras 3 segundos.
   */
  private showToastNotification(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    this.showToast = true;
    this.cdr.detectChanges();

    // Los toasts de error se auto-ocultan; los de éxito navegan antes de necesitar ocultarse
    if (type === 'error') {
      setTimeout(() => {
        this.showToast = false;
        this.cdr.detectChanges();
      }, 3000);
    }
  }

  /** Cancela la operación y redirige a la lista de áreas del anfitrión. */
  onCancelar() {
    this.router.navigate(['/anfitrion/mis-areas']);
  }
}