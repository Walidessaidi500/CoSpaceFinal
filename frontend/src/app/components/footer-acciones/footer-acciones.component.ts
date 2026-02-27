import { Component, EventEmitter, Output, Input } from '@angular/core';


/**
 * Componente de Acciones del Pie de Formulario (Footer Acciones)
 *
 * Componente reutilizable que muestra los botones de acción "Guardar" y "Cancelar"
 * en la parte inferior de los formularios de creación/edición de espacios.
 *
 * Emite eventos al componente padre cuando el usuario interactúa con los botones,
 * delegando la lógica de negocio al componente contenedor.
 *
 * @Input isEditMode - Indica si el formulario está en modo edición para adaptar el texto del botón.
 * @Output guardar - Evento emitido al hacer clic en "Guardar"/"Publicar".
 * @Output cancelar - Evento emitido al hacer clic en "Cancelar".
 */
@Component({
  selector: 'app-footer-acciones',
  standalone: true,
  imports: [],
  templateUrl: './footer-acciones.component.html',
  styleUrl: './footer-acciones.component.css'
})
export class FooterAccionesComponent {
  /** Indica si el formulario está en modo edición (true) o creación (false) */
  @Input() isEditMode: boolean = false;
  /** Evento emitido al hacer clic en el botón de guardar */
  @Output() guardar = new EventEmitter<void>();
  /** Evento emitido al hacer clic en el botón de cancelar */
  @Output() cancelar = new EventEmitter<void>();
}