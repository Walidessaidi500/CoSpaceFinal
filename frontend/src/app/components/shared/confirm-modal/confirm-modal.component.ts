import { Component, EventEmitter, Input, Output } from '@angular/core';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Modal de Confirmación (Confirm Modal)
 *
 * Componente reutilizable que muestra un diálogo modal de confirmación
 * antes de ejecutar acciones destructivas (eliminar espacios, usuarios, reservas, etc.).
 *
 * Se utiliza en todo el panel de administración y en las vistas de edición
 * para prevenir eliminaciones accidentales.
 *
 * @Input isOpen - Controla la visibilidad del modal.
 * @Input title - Título del modal (ej: '¿Estás seguro?').
 * @Input message - Mensaje descriptivo de la acción a confirmar.
 * @Input isLoading - Muestra un estado de carga en el botón de confirmación.
 * @Output confirm - Evento emitido cuando el usuario confirma la acción.
 * @Output cancel - Evento emitido cuando el usuario cancela la acción.
 */
@Component({
    selector: 'app-confirm-modal',
    standalone: true,
    imports: [TranslateModule],
    templateUrl: './confirm-modal.component.html',
    styleUrls: ['./confirm-modal.component.css']
})
export class ConfirmModalComponent {
    /** Controla si el modal es visible o no */
    @Input() isOpen = false;
    /** Título del diálogo de confirmación */
    @Input() title = '¿Estás seguro?';
    /** Mensaje descriptivo de la acción que se va a realizar */
    @Input() message = 'Esta acción no se puede deshacer.';
    /** Indica si la acción de confirmación está en proceso */
    @Input() isLoading = false;

    /** Evento emitido al confirmar la acción */
    @Output() confirm = new EventEmitter<void>();
    /** Evento emitido al cancelar la acción */
    @Output() cancel = new EventEmitter<void>();

    /** Emite el evento de confirmación al componente padre. */
    onConfirm() {
        this.confirm.emit();
    }

    /** Emite el evento de cancelación al componente padre. */
    onCancel() {
        this.cancel.emit();
    }
}
