import { Component } from '@angular/core';

import { SidebarAnfitrionComponent } from '../sidebar-anfitrion/sidebar-anfitrion.component';
import { ListaMisAreasComponent } from '../lista-mis-areas/lista-mis-areas.component';

/**
 * Componente de la Página "Mis Áreas" del Anfitrión
 *
 * Actúa como contenedor de layout para la vista "Mis Áreas",
 * combinando la barra lateral del anfitrión (SidebarAnfitrionComponent)
 * con el listado de espacios publicados (ListaMisAreasComponent).
 *
 * Toda la lógica de negocio (carga, eliminación, etc.) se delega
 * al componente ListaMisAreasComponent para mantener separadas las responsabilidades.
 */
@Component({
    selector: 'app-mis-areas',
    standalone: true,
    imports: [SidebarAnfitrionComponent, ListaMisAreasComponent],
    templateUrl: './mis-areas.component.html'
})
export class MisAreasComponent {
    constructor() {
    }
}
