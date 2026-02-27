import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

/**
 * Servicio de Espacios (EspaciosService)
 *
 * Proporciona métodos HTTP para gestionar los espacios de coworking desde el frontend.
 * Incluye operaciones CRUD: crear, listar (público y por anfitrión), obtener por ID,
 * actualizar y eliminar espacios. Se utiliza principalmente por los componentes de
 * crear/editar espacio y el listado de "Mis Áreas" del anfitrión.
 *
 * Nota: La URL base de la API está configurada directamente como constante.
 * Los métodos de actualización usan POST en lugar de PUT para compatibilidad con
 * formularios multipart (que incluyen archivos) en Laravel.
 */
@Injectable({
  providedIn: 'root'
})
export class EspaciosService {
  // URL base de la API del backend
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Crea un nuevo espacio de coworking enviando los datos del formulario al backend.
   * Los datos pueden incluir archivos (fotos) si se envían como FormData.
   */
  crearEspacio(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/espacios`, data);
  }

  /**
   * Obtiene la lista pública de todos los espacios disponibles en la plataforma.
   */
  getEspacios(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/espacios`);
  }

  /**
   * Obtiene la lista de espacios que pertenecen al anfitrión autenticado.
   * Se usa en la sección "Mis Áreas" del panel del anfitrión.
   */
  getEspaciosAnfitrion(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/anfitrion/espacios`);
  }

  /**
   * Elimina un espacio del anfitrión por su identificador.
   */
  deleteEspacio(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/espacios/${id}`);
  }

  /**
   * Obtiene los detalles completos de un espacio por su identificador.
   * Incluye fotos, servicios y datos del anfitrión.
   */
  getEspacioById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/espacios/${id}`);
  }

  /**
   * Actualiza los datos de un espacio existente.
   * Se utiliza POST en lugar de PUT porque Laravel tiene problemas para procesar
   * archivos multipart con el método PUT. El backend maneja esta ruta como actualización.
   */
  updateEspacio(id: string, data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/espacios/${id}`, data);
  }
}
