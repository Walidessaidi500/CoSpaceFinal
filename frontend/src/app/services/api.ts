import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { environment } from '../../environments/enviroments';

/**
 * Servicio API Genérico (ApiService)
 *
 * Proporciona métodos para realizar peticiones HTTP genéricas al backend de la API.
 * Incluye métodos específicos para operaciones comunes (registro, login, espacios)
 * y un método genérico GET para peticiones adicionales.
 * La URL base de la API se obtiene de la configuración del entorno (environment).
 */
@Injectable({
  providedIn: 'root'
})
export class ApiService {

  private http = inject(HttpClient);

  /**
   * Verifica la conexión con el backend realizando una petición GET al endpoint de prueba.
   * Se usa al iniciar la aplicación para confirmar que la API está accesible.
   */
  testConexion() {
    return this.http.get(`${environment.apiUrl}/test-conexion`);
  }

  /**
   * Registra un nuevo usuario con rol de Anfitrión en la plataforma.
   * Envía los datos del formulario de registro (datos del usuario + datos del primer espacio).
   */
  register(data: any) {
    return this.http.post(`${environment.apiUrl}/register`, data);
  }

  /**
   * Registra un nuevo usuario con rol de Cliente en la plataforma.
   * Envía los datos básicos del formulario de registro (nombre, email, contraseña).
   */
  registerClient(data: any) {
    return this.http.post(`${environment.apiUrl}/register-client`, data);
  }

  /**
   * Inicia sesión de un usuario con sus credenciales (email y contraseña).
   * Devuelve el token de acceso o solicita la verificación 2FA según la configuración del usuario.
   */
  login(data: any) {
    return this.http.post(`${environment.apiUrl}/login`, data);
  }

  /**
   * Obtiene la lista completa de todos los espacios de coworking disponibles.
   * Este endpoint es público y no requiere autenticación.
   */
  getEspacios() {
    return this.http.get(`${environment.apiUrl}/espacios`);
  }

  /**
   * Obtiene los detalles completos de un espacio específico por su identificador.
   * Incluye fotos, servicios y datos del anfitrión.
   */
  getEspacioById(id: string | number) {
    return this.http.get(`${environment.apiUrl}/espacios/${id}`);
  }

  /**
   * Obtiene el perfil público de un anfitrión y sus espacios disponibles.
   * Incluye datos del usuario, los espacios publicados y sus fotos.
   */
  getAnfitrionById(id: string | number) {
    return this.http.get(`${environment.apiUrl}/anfitriones/${id}`);
  }

  /**
   * Método genérico para realizar peticiones GET a cualquier endpoint de la API.
   * El path se concatena a la URL base del entorno.
   *
   * @param path Ruta relativa del endpoint (debe empezar con /).
   */
  get(path: string) {
    return this.http.get(`${environment.apiUrl}${path}`);
  }
}
