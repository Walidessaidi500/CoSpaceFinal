import { Component } from '@angular/core';

import { RouterModule } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de la Barra Lateral del Anfitrión (Sidebar Anfitrión)
 *
 * Muestra el menú de navegación lateral para los usuarios con rol de Anfitrión.
 * Incluye enlaces a las secciones: Mis Áreas (espacios), Reservas,
 * Crear Espacio y Configuración. Se traduce automáticamente según el idioma
 * seleccionado mediante ngx-translate.
 */
@Component({
  selector: 'app-sidebar-anfitrion',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './sidebar-anfitrion.component.html',
  styleUrl: './sidebar-anfitrion.component.css'
})
export class SidebarAnfitrionComponent { }