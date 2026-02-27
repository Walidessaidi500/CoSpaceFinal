import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { environment } from '../../../environments/enviroments';

@Component({
    selector: 'app-contacto',
    standalone: true,
    imports: [CommonModule, ReactiveFormsModule, RouterModule, TranslateModule],
    templateUrl: './contacto.component.html',
})
export class ContactoComponent {
    contactForm: FormGroup;
    isLoading = false;
    successMessage = '';
    errorMessage = '';

    constructor(private fb: FormBuilder, private http: HttpClient) {
        this.contactForm = this.fb.group({
            nombre: ['', Validators.required],
            email: ['', [Validators.required, Validators.email]],
            asunto: ['', Validators.required],
            mensaje: ['', Validators.required]
        });
    }

    onSubmit() {
        if (this.contactForm.invalid) {
            this.contactForm.markAllAsTouched();
            return;
        }

        this.isLoading = true;
        this.successMessage = '';
        this.errorMessage = '';

        this.http.post(`${environment.apiUrl}/contacto`, this.contactForm.value).subscribe({
            next: (res: any) => {
                this.isLoading = false;
                this.successMessage = '¡Mensaje enviado con éxito! Te responderemos pronto.';
                this.contactForm.reset();
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = 'Hubo un error al enviar tu mensaje. Por favor, intenta de nuevo más tarde.';
                console.error(err);
            }
        });
    }
}
