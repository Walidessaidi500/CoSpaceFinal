import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

/**
 * Servicio de Administración (AdminService)
 *
 * Proporciona todos los métodos HTTP necesarios para que el panel de administración
 * de CoSpace se comunique con la API del backend. Incluye operaciones CRUD para:
 * - Dashboard: obtener las estadísticas generales de la plataforma.
 * - Espacios: listar, actualizar y eliminar espacios de coworking.
 * - Usuarios: listar, actualizar y eliminar cuentas de usuario.
 * - Reservas: listar, actualizar y eliminar reservas.
 * - Reportes: listar, actualizar estado y eliminar reportes de espacios.
 * - Pagos: listar y eliminar registros de pagos.
 *
 * Todos los endpoints apuntan a la ruta /admin de la API y requieren autenticación.
 */
@Injectable({
    providedIn: 'root'
})
export class AdminService {
    private http = inject(HttpClient);
    // URL base de la API de administración
    private apiUrl = `${environment.apiUrl}/admin`;

    /**
     * Obtiene las estadísticas del dashboard de administración.
     * Incluye totales de usuarios, espacios, reservas, ingresos y variaciones mensuales.
     */
    getDashboardStats(): Observable<any> {
        console.log('AdminService: Requesting stats from', `${this.apiUrl}/dashboard`);
        return this.http.get<any>(`${this.apiUrl}/dashboard`);
    }

    /**
     * Obtiene la lista completa de todos los espacios registrados en la plataforma.
     */
    getAllSpaces(): Observable<any> {
        console.log('AdminService: Requesting all spaces from', `${this.apiUrl}/espacios`);
        return this.http.get<any>(`${this.apiUrl}/espacios`);
    }

    /**
     * Elimina un espacio específico de la plataforma por su identificador.
     */
    deleteSpace(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/espacios/${id}`);
    }

    /**
     * Obtiene la lista completa de todos los usuarios registrados en la plataforma.
     */
    getAllUsers(): Observable<any> {
        console.log('AdminService: Requesting all users from', `${this.apiUrl}/usuarios`);
        return this.http.get<any>(`${this.apiUrl}/usuarios`);
    }

    /**
     * Actualiza los datos de un usuario específico (nombre, email, rol, estado, etc.).
     * Se usa POST en lugar de PUT para compatibilidad con formularios multipart en Laravel.
     */
    updateUser(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/usuarios/${id}`, data);
    }

    /**
     * Elimina un usuario específico de la plataforma por su identificador.
     */
    deleteUser(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/usuarios/${id}`);
    }

    /**
     * Actualiza los datos de un espacio específico desde el panel de administración.
     * Se usa POST en lugar de PUT para compatibilidad con formularios multipart en Laravel.
     */
    updateSpace(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/espacios/${id}`, data);
    }

    /**
     * Obtiene la lista completa de todas las reservas registradas en la plataforma.
     */
    getAllReservations(): Observable<any> {
        console.log('AdminService: Requesting all reservations from', `${this.apiUrl}/reservas`);
        return this.http.get<any>(`${this.apiUrl}/reservas`);
    }

    /**
     * Actualiza los datos de una reserva específica (estado, fechas, etc.).
     */
    updateReservation(id: number, data: any): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/reservas/${id}`, data);
    }

    /**
     * Elimina una reserva específica de la plataforma por su identificador.
     */
    deleteReservation(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/reservas/${id}`);
    }

    /**
     * Obtiene la lista completa de todos los reportes de espacios creados por los clientes.
     */
    getAllReportes(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/reportes`);
    }

    /**
     * Actualiza el estado de un reporte (Pendiente, Revisado, Resuelto, Rechazado).
     */
    updateReporteEstado(id: number, estado: string): Observable<any> {
        return this.http.post<any>(`${this.apiUrl}/reportes/${id}`, { estado });
    }

    /**
     * Elimina un reporte específico de la plataforma por su identificador.
     */
    deleteReporte(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/reportes/${id}`);
    }

    /**
     * Obtiene la lista completa de todos los pagos registrados en la plataforma.
     */
    getAllPagos(): Observable<any> {
        return this.http.get<any>(`${this.apiUrl}/pagos`);
    }

    /**
     * Elimina un registro de pago específico por su identificador.
     */
    deletePago(id: number): Observable<any> {
        return this.http.delete<any>(`${this.apiUrl}/pagos/${id}`);
    }
}
