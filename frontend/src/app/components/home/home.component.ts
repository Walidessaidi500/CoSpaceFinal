import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de la Página de Inicio (Home)
 *
 * Muestra la página principal de la plataforma CoSpace con información
 * general sobre el servicio, secciones destacadas y llamadas a la acción
 * para que los visitantes exploren espacios o se registren como anfitriones.
 * Todo el contenido se traduce automáticamente según el idioma seleccionado.
 */
@Component({
  selector: 'app-home',
  imports: [RouterLink, TranslateModule],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {

}
