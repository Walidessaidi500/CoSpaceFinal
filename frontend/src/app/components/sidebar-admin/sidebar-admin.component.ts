import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de la Barra Lateral de Administración (Sidebar Admin)
 *
 * Muestra el menú de navegación lateral del panel de administración.
 * Incluye enlaces a las diferentes secciones: Dashboard, Espacios, Usuarios,
 * Reservas, Reportes y Pagos. Todo el contenido se traduce automáticamente
 * según el idioma seleccionado por el usuario mediante ngx-translate.
 */
@Component({
    selector: 'app-sidebar-admin',
    standalone: true,
    imports: [RouterModule, TranslateModule],
    templateUrl: './sidebar-admin.component.html',
})
export class SidebarAdminComponent { }
