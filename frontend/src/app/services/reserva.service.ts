import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/enviroments';

/**
 * Servicio de Reservas (ReservaService)
 *
 * Gestiona las operaciones HTTP relacionadas con el flujo de reservas de espacios
 * en la plataforma CoSpace. Incluye la creación de intenciones de pago con Stripe,
 * la confirmación de reservas, la obtención de reservas del usuario (cliente y anfitrión),
 * y la actualización de estados de reserva por parte del anfitrión.
 *
 * Nota: Este servicio genera sus propios encabezados de autorización manualmente.
 * En la práctica, el interceptor de autenticación ya añade el token Bearer a todas
 * las peticiones, por lo que estos encabezados podrían ser redundantes.
 */
@Injectable({
    providedIn: 'root'
})
export class ReservaService {
    // URL base de la API obtenida de la configuración del entorno
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    /**
     * Construye los encabezados HTTP con el token de autenticación Bearer.
     * Lee el token desde localStorage para incluirlo en las peticiones protegidas.
     */
    private getHeaders(): HttpHeaders {
        const token = localStorage.getItem('auth_token');
        return new HttpHeaders().set('Authorization', `Bearer ${token}`);
    }

    /**
     * Paso 1 del flujo de reserva: crea una intención de pago en Stripe.
     * Envía los datos de la reserva (id_espacio, fecha_inicio, fecha_fin) al backend,
     * que verifica la disponibilidad, calcula el precio y devuelve el clientSecret de Stripe.
     */
    initiatePayment(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/create-payment-intent`, data, { headers: this.getHeaders() });
    }

    /**
     * Paso 2 del flujo de reserva: confirma y guarda la reserva tras el pago exitoso.
     * Envía el ID del PaymentIntent confirmado junto con los datos de la reserva
     * para que el backend verifique el pago y registre la reserva en la base de datos.
     */
    crearReserva(data: any): Observable<any> {
        return this.http.post(`${this.apiUrl}/reservas`, data, { headers: this.getHeaders() });
    }

    /**
     * Obtiene todas las reservas del cliente autenticado.
     * Se usa en el panel del cliente para mostrar su historial de reservas.
     */
    getUserReservations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/reservas/usuario`, { headers: this.getHeaders() });
    }

    /**
     * Obtiene todas las reservas recibidas por los espacios del anfitrión autenticado.
     * Se usa en el panel del anfitrión para gestionar las reservas de sus espacios.
     */
    getHostReservations(): Observable<any> {
        return this.http.get(`${this.apiUrl}/anfitrion/reservas-recibidas`, { headers: this.getHeaders() });
    }

    /**
     * Permite al anfitrión actualizar el estado de una reserva de sus espacios.
     * Los estados posibles son: Confirmada, En_Curso, Finalizada, Cancelada.
     *
     * @param reservaId ID de la reserva a actualizar.
     * @param estado Nuevo estado de la reserva.
     */
    updateEstadoAnfitrion(reservaId: number, estado: string): Observable<any> {
        return this.http.post(`${this.apiUrl}/anfitrion/reservas/${reservaId}/estado`, { estado }, { headers: this.getHeaders() });
    }
}
