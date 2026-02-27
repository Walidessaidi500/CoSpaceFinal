import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

/**
 * Servicio de Valoraciones (ValoracionService)
 *
 * Gestiona las operaciones HTTP relacionadas con las valoraciones (reseñas)
 * de los espacios de coworking en la plataforma CoSpace.
 * Permite obtener las valoraciones de un espacio con filtros y paginación,
 * y crear nuevas valoraciones (solo clientes autenticados con reserva previa).
 */
@Injectable({
  providedIn: 'root'
})
export class ValoracionService {
  // URL base de la API obtenida de la configuración del entorno
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  /**
   * Obtiene las valoraciones de un espacio específico con filtros opcionales.
   * Los filtros disponibles son:
   * - sort: ordenación ('reciente', 'antigua', 'mayor_puntuacion', 'menor_puntuacion').
   * - puntuacion: filtro por puntuación exacta (1-5 estrellas).
   * - page: número de página para la paginación.
   *
   * La respuesta incluye un resumen estadístico (promedio, total, distribución)
   * y la lista paginada de valoraciones.
   *
   * @param espacioId ID del espacio cuyas valoraciones se consultan.
   * @param params Parámetros opcionales de filtrado y paginación.
   */
  getValoraciones(espacioId: string | number, params?: { sort?: string; puntuacion?: number; page?: number }): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.sort) {
      httpParams = httpParams.set('sort', params.sort);
    }
    if (params?.puntuacion) {
      httpParams = httpParams.set('puntuacion', params.puntuacion.toString());
    }
    if (params?.page) {
      httpParams = httpParams.set('page', params.page.toString());
    }
    return this.http.get<any>(`${this.apiUrl}/espacios/${espacioId}/valoraciones`, { params: httpParams });
  }

  /**
   * Crea una nueva valoración para un espacio.
   * Solo puede ser llamado por clientes autenticados que tengan al menos una reserva
   * en el espacio y que no hayan escrito ya una reseña para ese espacio.
   *
   * @param espacioId ID del espacio a valorar.
   * @param data Datos de la valoración: puntuación (1-5) y comentario opcional.
   */
  crearValoracion(espacioId: string | number, data: { puntuacion: number; comentario?: string }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/espacios/${espacioId}/valoraciones`, data);
  }
}
