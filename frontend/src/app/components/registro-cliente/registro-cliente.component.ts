import { Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';

import { Router, RouterModule, RouterLink } from '@angular/router';
import { ApiService } from '../../services/api';

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Registro de Cliente
 *
 * Gestiona el formulario de registro para nuevos clientes de la plataforma CoSpace.
 * Requiere los datos básicos del usuario: nombre completo, email, contraseña
 * y confirmación de contraseña.
 *
 * Incluye un validador personalizado para verificar que las contraseñas coincidan.
 * El campo de confirmación de contraseña se elimina antes de enviar los datos
 * al backend, ya que no es necesario en el endpoint de registro.
 */
@Component({
  selector: 'app-registro-cliente',
  standalone: true,
  imports: [RouterLink, ReactiveFormsModule, TranslateModule],
  templateUrl: './registro-cliente.component.html',
  styleUrl: './registro-cliente.component.css',
})
export class RegistroClienteComponent {
  /** Formulario reactivo con los campos de registro del cliente */
  registerForm: FormGroup;
  /** Indicador de estado de carga durante el registro */
  loading = false;

  constructor(
    private fb: FormBuilder,
    private apiService: ApiService,
    private router: Router
  ) {
    this.registerForm = this.fb.group({
      nombre_completo: ['', Validators.required],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required]
    }, { validators: this.passwordMatchValidator });
  }

  /**
   * Validador personalizado que verifica que la contraseña y su confirmación coincidan.
   * @returns null si coinciden, o un objeto { mismatch: true } si no.
   */
  passwordMatchValidator(form: FormGroup) {
    return form.get('password')?.value === form.get('confirmPassword')?.value
      ? null : { mismatch: true };
  }

  /**
   * Envía los datos de registro al backend.
   * Se elimina el campo confirmPassword antes del envío porque el backend no lo necesita.
   * Si el registro es exitoso, redirige al login.
   */
  onSubmit() {
    if (this.registerForm.invalid) {
      this.registerForm.markAllAsTouched();
      return;
    }

    this.loading = true;
    // Se elimina confirmPassword ya que el backend no lo espera
    const { confirmPassword, ...dataToSend } = this.registerForm.value;

    this.apiService.registerClient(dataToSend).subscribe({
      next: (res: any) => {
        console.log('Cliente registrado:', res);
        alert('Cuenta de cliente creada con éxito');
        this.router.navigate(['/login']);
        this.loading = false;
      },
      error: (err: any) => {
        console.error('Error al registrar cliente:', err);
        alert('Error al registrar. Por favor intenta de nuevo.');
        this.loading = false;
      }
    });
  }
}
