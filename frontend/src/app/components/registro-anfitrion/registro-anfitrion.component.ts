import { Component, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { Router, RouterModule, RouterLink } from '@angular/router';


declare var google: any;

import { TranslateModule } from '@ngx-translate/core';

/**
 * Componente de Registro de Anfitrión
 *
 * Gestiona el formulario de registro para nuevos anfitriones de la plataforma CoSpace.
 * A diferencia del registro de clientes, el anfitrión debe proporcionar información
 * adicional sobre su primer espacio de coworking durante el registro:
 *
 * - **Datos personales**: Nombre, email, contraseña.
 * - **Datos del espacio**: Título, dirección, ciudad, capacidad, precio/hora, descripción.
 *
 * Integra Google Maps Places Autocomplete para facilitar la introducción de direcciones,
 * extrayendo automáticamente la ciudad, latitud y longitud del lugar seleccionado.
 *
 * Incluye un validador personalizado para verificar que las contraseñas coincidan.
 */
@Component({
    selector: 'app-registro-anfitrion',
    standalone: true,
    imports: [RouterLink, ReactiveFormsModule, TranslateModule],
    templateUrl: './registro-anfitrion.component.html',
    styleUrl: './registro-anfitrion.component.css'
})
export class RegistroAnfitrionComponent implements AfterViewInit {
    /** Referencia al campo de dirección para vincularlo con Google Places Autocomplete */
    @ViewChild('addressInput') addressInput!: ElementRef;

    /** Formulario reactivo con los campos del anfitrión y su primer espacio */
    registroForm: FormGroup;
    /** Indicador de estado de carga durante el registro */
    loading = false;
    /** Mensaje de error si el registro falla */
    errorMessage = '';

    constructor(
        private fb: FormBuilder,
        private apiService: ApiService,
        private router: Router,
        private ngZone: NgZone
    ) {
        this.registroForm = this.fb.group({
            nombre_completo: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            password: ['', [Validators.required, Validators.minLength(8)]],
            password_confirmation: ['', Validators.required],
            titulo: ['', Validators.required],        // Nombre del espacio
            direccion: ['', Validators.required],
            ciudad: ['', Validators.required],
            latitud: [null],
            longitud: [null],
            capacidad: ['', [Validators.required, Validators.min(1)]],
            precio_hora: ['', [Validators.required, Validators.min(0)]],
            descripcion: ['', Validators.required]
        }, { validators: this.passwordMatchValidator });
    }

    /** Inicializa el autocompletado de Google Maps una vez la vista está lista. */
    ngAfterViewInit() {
        this.initAutocomplete();
    }

    /**
     * Configura Google Maps Places Autocomplete en el campo de dirección.
     * Al seleccionar un lugar, extrae automáticamente:
     * - Dirección formateada
     * - Ciudad (locality o administrative_area_level_2 como fallback)
     * - Coordenadas (latitud y longitud)
     *
     * NgZone.run() asegura que Angular detecte los cambios realizados desde el callback de Google.
     */
    initAutocomplete() {
        if (typeof google === 'undefined' || !google.maps || !google.maps.places) {
            console.error('Google Maps JavaScript API not loaded.');
            return;
        }

        const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
            types: ['address'],
            fields: ['address_components', 'geometry', 'formatted_address']
        });

        autocomplete.addListener('place_changed', () => {
            this.ngZone.run(() => {
                const place = autocomplete.getPlace();

                if (!place.geometry) {
                    console.error("No details available for input: '" + place.name + "'");
                    return;
                }

                // Se extraen las coordenadas geográficas
                const lat = place.geometry.location.lat();
                const lng = place.geometry.location.lng();

                // Se obtiene la dirección formateada
                let address = place.formatted_address;

                // Se extrae la ciudad de los componentes de dirección
                let city = '';
                for (const component of place.address_components) {
                    const types = component.types;
                    if (types.includes('locality')) {
                        city = component.long_name;
                    }
                    // Fallback si no se encuentra 'locality'
                    if (!city && types.includes('administrative_area_level_2')) {
                        city = component.long_name;
                    }
                }

                // Se actualizan los campos del formulario con los datos extraídos
                this.registroForm.patchValue({
                    direccion: address,
                    ciudad: city,
                    latitud: lat,
                    longitud: lng
                });
            });
        });
    }

    /**
     * Validador personalizado que verifica que la contraseña y su confirmación coincidan.
     * @returns null si las contraseñas coinciden, o un objeto { mismatch: true } si no.
     */
    passwordMatchValidator(form: FormGroup) {
        return form.get('password')?.value === form.get('password_confirmation')?.value
            ? null : { mismatch: true };
    }

    /**
     * Envía los datos de registro al backend.
     * Si el registro es exitoso, redirige al usuario a la vista de inicio de sesión.
     */
    onSubmit() {
        if (this.registroForm.invalid) {
            this.registroForm.markAllAsTouched();
            return;
        }

        this.loading = true;
        this.apiService.register(this.registroForm.value).subscribe({
            next: (res: any) => {
                alert('Cuenta creada con éxito');
                this.router.navigate(['/iniciar-sesion']);
            },
            error: (err: any) => {
                this.errorMessage = 'Hubo un error en el registro. Verifica los datos.';
                this.loading = false;
                console.error(err);
            }
        });
    }
}
