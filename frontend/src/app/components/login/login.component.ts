import { Component } from '@angular/core';
import { LoginFormComponent } from '../login-form/login-form.component';

/**
 * Componente de la Página de Inicio de Sesión (Login)
 *
 * Actúa como contenedor para el formulario de inicio de sesión (LoginFormComponent).
 * Se centra vertical y horizontalmente en la pantalla mediante estilos flexbox
 * para proporcionar una experiencia de usuario centrada y limpia.
 */
@Component({
    selector: 'app-login',
    standalone: true,
    imports: [LoginFormComponent],
    templateUrl: './login.component.html',
    styles: [`
        :host {
            display: flex;
            flex-direction: column;
            flex-grow: 1;
            justify-content: center;
            min-height: 100%;
        }
    `]
})
export class LoginComponent { }
