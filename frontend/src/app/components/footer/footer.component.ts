import { Component, inject } from '@angular/core';
import { AsyncPipe } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../services/auth.service';

/**
 * Componente del Pie de Página (Footer)
 *
 * Muestra el pie de página de la aplicación CoSpace con enlaces de navegación,
 * información legal y créditos. Utiliza el módulo de traducción para mostrar
 * el contenido en el idioma seleccionado por el usuario.
 */
@Component({
    selector: 'app-footer',
    standalone: true,
    imports: [TranslateModule, RouterLink, AsyncPipe],
    templateUrl: './footer.component.html',
})
export class FooterComponent {
    authService = inject(AuthService);
    currentUser$ = this.authService.currentUser$;
}
