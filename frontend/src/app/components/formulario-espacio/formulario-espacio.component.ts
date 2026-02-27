import { Component, Input, ChangeDetectorRef, ElementRef, ViewChild, AfterViewInit, NgZone } from '@angular/core';

import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { EspaciosService } from '../../services/espacios';
import { environment } from '../../../environments/enviroments';

/** Declaración global de Google Maps para TypeScript */
declare var google: any;

/**
 * Componente de Formulario de Espacio (Formulario Espacio)
 *
 * Formulario reutilizable para la creación y edición de espacios de coworking.
 * Es utilizado tanto por CrearEspacioComponent como por EspacioAdminEditComponent.
 *
 * Funcionalidades:
 * - **Campos de texto**: Título, ciudad, dirección, descripción, precio/hora, capacidad.
 * - **Google Maps Autocomplete**: Sugiere direcciones y extrae automáticamente ciudad,
 *   latitud y longitud del lugar seleccionado.
 * - **Servicios/Amenidades**: Checkboxes para seleccionar los servicios disponibles (WiFi,
 *   Café, Impresora, etc.) con IDs fijos que corresponden a la tabla de servicios del backend.
 * - **Galería de imágenes**: Soporte para selección múltiple de archivos y arrastrar y soltar (drag & drop),
 *   con previsualización de imágenes.
 *
 * Los datos del formulario se envían como FormData (multipart/form-data) para soportar
 * tanto los campos de texto como la subida de archivos de imagen.
 */
@Component({
  selector: 'app-formulario-espacio',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './formulario-espacio.component.html',
  styleUrl: './formulario-espacio.component.css'
})
export class FormularioEspacioComponent implements AfterViewInit {
  /** Referencia al campo de dirección para vincularlo con Google Places Autocomplete */
  @ViewChild('addressInput') addressInput!: ElementRef;
  /** Indica si el formulario está en modo edición */
  @Input() isEditMode: boolean = false;

  /** Formulario reactivo con los campos del espacio */
  espacioForm: FormGroup;
  /** Archivos de imagen seleccionados por el usuario */
  selectedFiles: File[] = [];
  /** URLs de previsualización de las imágenes seleccionadas */
  /** URLs de previsualización de las imágenes seleccionadas */
  previewImages: string[] = [];
  /** Lista original de fotos existentes cargadas desde el backend */
  existingPhotos: any[] = [];
  /** IDs de fotos existentes que el usuario ha solicitado eliminar */
  fotosEliminadasIds: number[] = [];

  /**
   * Lista de amenidades disponibles con IDs fijos que corresponden
   * a los registros de la tabla 'servicios' en la base de datos.
   */
  amenidades = [
    { id: 1, nombre: 'WiFi de Alta Velocidad' },
    { id: 2, nombre: 'Café y Té Gratis' },
    { id: 3, nombre: 'Impresora' },
    { id: 4, nombre: 'Salas de Reuniones' },
    { id: 5, nombre: 'Estacionamiento' },
    { id: 6, nombre: 'Aire Acondicionado' },
    { id: 7, nombre: 'Pizarras' },
    { id: 8, nombre: 'Cocina' }
  ];

  constructor(
    private fb: FormBuilder,
    private cdr: ChangeDetectorRef,
    private ngZone: NgZone
  ) {
    this.espacioForm = this.fb.group({
      titulo: ['', Validators.required],
      ciudad: ['', Validators.required],
      direccion: ['', Validators.required],
      descripcion: ['', [Validators.required, Validators.minLength(20)]],
      precio_hora: ['', [Validators.required, Validators.min(1)]],
      capacidad: ['', [Validators.required, Validators.min(1)]],
      servicios: [[]],
      latitud: [''],
      longitud: ['']
    });
  }

  /** Inicializa el autocompletado de Google Maps una vez la vista esté lista. */
  ngAfterViewInit() {
    this.initAutocomplete();
  }

  /**
   * Configura Google Maps Places Autocomplete en el campo de dirección.
   * Al seleccionar un lugar, extrae automáticamente:
   * - Dirección formateada
   * - Ciudad (locality o administrative_area_level_2 como fallback)
   * - Coordenadas geográficas (latitud y longitud)
   */
  initAutocomplete() {
    if (typeof google !== 'undefined') {
      const autocomplete = new google.maps.places.Autocomplete(this.addressInput.nativeElement, {
        types: ['geocode'],
        fields: ['address_components', 'geometry', 'formatted_address']
      });

      autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = autocomplete.getPlace();

          if (!place.geometry) {
            // El usuario escribió una dirección que no fue sugerida y presionó Enter
            return;
          }

          // Se actualizan la dirección y las coordenadas en el formulario
          this.espacioForm.patchValue({
            direccion: place.formatted_address,
            latitud: place.geometry.location.lat(),
            longitud: place.geometry.location.lng()
          });

          // Se extrae la ciudad de los componentes de dirección
          let city = '';
          for (const component of place.address_components) {
            const types = component.types;
            if (types.includes('locality')) {
              city = component.long_name;
              break;
            }
          }

          // Fallback: si no se encuentra 'locality', se busca 'administrative_area_level_2'
          if (!city) {
            for (const component of place.address_components) {
              if (component.types.includes('administrative_area_level_2')) {
                city = component.long_name;
                break;
              }
            }
          }

          if (city) {
            this.espacioForm.patchValue({ ciudad: city });
          }
        });
      });
    }
  }

  /**
   * Alterna la selección de una amenidad/servicio.
   * Añade o elimina el ID del servicio del array de servicios del formulario.
   */
  toggleAmenidad(id: number, event: any) {
    const current = this.espacioForm.get('servicios')?.value as number[];
    if (event.target.checked) {
      this.espacioForm.patchValue({ servicios: [...current, id] });
    } else {
      this.espacioForm.patchValue({ servicios: current.filter((x: number) => x !== id) });
    }
  }

  // ========================
  // MANEJO DE ARCHIVOS DE IMAGEN
  // ========================

  /** Maneja la selección de archivos desde el input file. */
  onFileSelected(event: any) {
    if (event.target.files && event.target.files.length > 0) {
      this.processFiles(Array.from(event.target.files));
      // Se resetea el input para permitir seleccionar el mismo archivo de nuevo
      event.target.value = '';
    }
  }

  /** Previene el comportamiento por defecto al arrastrar archivos sobre la zona de drop. */
  onDragOver(event: any) {
    event.preventDefault();
    event.stopPropagation();
  }

  /** Maneja el drop de archivos arrastrados a la zona de drop. */
  onFileDropped(event: any) {
    event.preventDefault();
    event.stopPropagation();
    if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
      this.processFiles(Array.from(event.dataTransfer.files));
    }
  }

  /**
   * Procesa los archivos seleccionados: valida que sean imágenes,
   * los añade a la lista y genera previsualizaciones Base64.
   */
  processFiles(files: File[]) {
    for (let file of files) {
      // Solo se aceptan archivos de imagen
      if (file.type.match(/image\/*/) == null) {
        continue;
      }

      this.selectedFiles.push(file);

      // Se genera la previsualización usando FileReader
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.previewImages.push(e.target.result);
        this.cdr.detectChanges();
      }
      reader.readAsDataURL(file);
    }
  }

  /** Elimina un archivo y su previsualización en el índice especificado. */
  removeFile(index: number) {
    if (index < this.existingPhotos.length) {
      // Es una foto que ya existía en la base de datos
      this.fotosEliminadasIds.push(this.existingPhotos[index].id_foto);
      this.existingPhotos.splice(index, 1);
    } else {
      // Es una foto recién añadida que no está en la base de datos
      this.selectedFiles.splice(index - this.existingPhotos.length, 1);
    }
    this.previewImages.splice(index, 1);
  }

  /**
   * Prepara los datos del formulario como FormData para el envío al backend.
   * Los servicios se envían como array (servicios[]) para que Laravel los procese correctamente.
   * Las imágenes se envían como array (fotos[]).
   * @returns FormData con todos los campos y archivos listos para enviar.
   */
  getFormData(): FormData {
    const formData = new FormData();

    // Se añaden los campos de texto del formulario
    Object.keys(this.espacioForm.controls).forEach(key => {
      if (key === 'servicios') {
        // Los arrays en FormData se envían con sufijo [] para Laravel
        const servicios = this.espacioForm.get('servicios')?.value;
        if (servicios && Array.isArray(servicios)) {
          servicios.forEach((id: number) => {
            formData.append('servicios[]', id.toString());
          });
        }
      } else {
        const value = this.espacioForm.get(key)?.value;
        if (value !== null && value !== undefined && value !== '') {
          formData.append(key, value);
        }
      }
    });

    // Se añaden los archivos de imagen
    this.selectedFiles.forEach((file) => {
      formData.append('fotos[]', file);
    });

    // Se envían los IDs de las fotos que el usuario ha eliminado
    this.fotosEliminadasIds.forEach((id) => {
      formData.append('fotos_eliminadas[]', id.toString());
    });

    return formData;
  }

  /**
   * Pre-rellena el formulario con los datos existentes de un espacio (modo edición).
   * Mapea los servicios a sus IDs y genera las previsualizaciones de las fotos existentes.
   */
  patchData(data: any) {
    this.espacioForm.patchValue({
      titulo: data.titulo,
      ciudad: data.ciudad,
      direccion: data.direccion,
      descripcion: data.descripcion,
      precio_hora: data.precio_hora,
      capacidad: data.capacidad,
      // Se extraen los IDs de los servicios del array de objetos
      servicios: data.servicios ? data.servicios.map((s: any) => s.id_servicio) : [],
      latitud: data.latitud,
      longitud: data.longitud
    });

    // Se generan las URLs de previsualización para las fotos existentes
    if (data.fotos && data.fotos.length > 0) {
      this.existingPhotos = [...data.fotos];
      this.previewImages = data.fotos.map((f: any) => this.getFullUrl(f.url_foto));
    }
  }

  /**
   * Construye la URL completa a partir de una ruta relativa del backend.
   * @param path Ruta relativa de la imagen.
   * @returns URL completa hacia el servidor backend.
   */
  private getFullUrl(path: string | null): string {
    if (!path) return '';
    if (path.startsWith('http') || path.startsWith('data:image')) return path;
    return `${environment.baseUrl}${path}`;
  }
}