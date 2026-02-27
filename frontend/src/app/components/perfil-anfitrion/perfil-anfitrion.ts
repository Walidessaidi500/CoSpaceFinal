import { Component, inject, OnInit, ChangeDetectorRef } from '@angular/core';

import { ActivatedRoute, RouterModule, Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ApiService } from '../../services/api';
import { environment } from '../../../environments/enviroments';

@Component({
  selector: 'app-perfil-anfitrion',
  standalone: true,
  imports: [RouterModule, TranslateModule],
  templateUrl: './perfil-anfitrion.html',
  styleUrl: './perfil-anfitrion.css',
})
export class PerfilAnfitrion implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private cdr = inject(ChangeDetectorRef);

  anfitrion: any = null;
  espacios: any[] = [];
  isLoading = true;
  errorMessage = '';

  ngOnInit() {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      if (id) {
        this.fetchAnfitrionData(id);
      } else {
        this.errorMessage = 'No se proporcionó un ID válido';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  fetchAnfitrionData(id: string) {
    console.log('Fetching data for anfitrion:', id);
    this.isLoading = true;
    this.apiService.getAnfitrionById(id).subscribe({
      next: (data: any) => {
        console.log('Data received from backend:', data);
        this.anfitrion = {
          id: data.id_usuario,
          nombre: data.usuario?.nombre_completo || 'Anfitrión',
          email: data.usuario?.email,
          biografia: data.biografia || 'Este anfitrión aún no ha añadido una biografía.',
          esVerificado: data.es_verificado,
          cantidadEspacios: data.cantidad_espacios,
          foto: this.getInitialFotoUrl(data.usuario?.foto_perfil)
        };

        // Transform spaces properties for display
        if (data.espacios) {
          this.espacios = data.espacios.map((esp: any) => ({
            id: esp.id_espacio,
            titulo: esp.titulo,
            ciudad: esp.ciudad,
            precio: esp.precio_hora,
            capacidad: esp.capacidad,
            estado: esp.estado,
            rating: esp.rating_promedio || 'N/A',
            // Default to placeholder if not image is found
            imagen: this.getImagenPrincipal(esp.fotos)
          }));
        }

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching anfitrion:', err);
        this.errorMessage = 'No se ha encontrado el perfil de este anfitrión.';
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  getInitial(nombre: string): string {
    return nombre ? nombre.charAt(0).toUpperCase() : 'A';
  }

  private getInitialFotoUrl(foto: string | null): string | null {
    if (!foto) return null;
    if (foto.startsWith('http') || foto.startsWith('data:image')) return foto;

    // Check if it's already a full path
    const storagePath = foto.startsWith('/storage/') ? foto
      : foto.startsWith('storage/') ? `/${foto}`
        : `/storage/${foto}`;

    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    return `${baseUrl}${storagePath}`;
  }

  private getImagenPrincipal(fotos: any[]): string {
    if (!fotos || fotos.length === 0) return 'assets/placeholder.jpg';

    // Find the photo marked as 'es_principal'
    const principal = fotos.find(f => f.es_principal == 1 || f.es_principal === true) || fotos[0];
    const url = principal.url_foto;

    if (url.startsWith('http') || url.startsWith('data:image')) return url;
    const baseUrl = environment.apiUrl.replace(/\/api\/?$/, '');
    const cleanUrl = url.startsWith('/') ? url : `/${url}`;
    return `${baseUrl}${cleanUrl}`;
  }

  volverAtras() {
    this.router.navigate(['/explorar']);
  }
}
