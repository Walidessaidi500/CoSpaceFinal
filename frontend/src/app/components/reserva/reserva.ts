import { Component, OnInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api';
import { ReservaService } from '../../services/reserva.service';
import { StripeService } from 'ngx-stripe';
import { StripeElements, StripePaymentElementOptions } from '@stripe/stripe-js';

/**
 * Componente de Reserva y Pago de Espacios
 *
 * Gestiona todo el flujo de reserva de un espacio de coworking, incluyendo:
 *
 * 1. **Calendario interactivo**: Permite al usuario seleccionar un rango de fechas
 *    (fecha inicio y fin) sobre un calendario visual mensual.
 * 2. **Disponibilidad**: Consulta al backend los días ocupados del mes visible
 *    y los marca como no seleccionables en el calendario.
 * 3. **Cálculo de precio**: Calcula el precio total incluyendo la comisión del 14.59%
 *    sobre el precio base por día.
 * 4. **Pago con Stripe**: Integra Stripe Elements para el procesamiento seguro
 *    del pago, soportando:
 *    - Tarjeta de crédito/débito (Payment Element)
 *    - Apple Pay / Google Pay (Payment Request Button)
 * 5. **Confirmación**: Tras el pago exitoso, guarda la reserva en el backend
 *    y redirige al panel del cliente.
 *
 * Flujo de pago en 3 pasos:
 * 1. `iniciarProcesoReserva()` → Crea una reserva pendiente y obtiene el clientSecret de Stripe.
 * 2. `realizarPago()` → Confirma el pago en Stripe usando los Elements montados.
 * 3. `finalizarReservaEnBD()` → Guarda la reserva confirmada en el backend con el ID del PaymentIntent.
 */
@Component({
  selector: 'app-reserva',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reserva.html',
  styleUrls: ['./reserva.css']
})
export class ReservaComponent implements OnInit {
  // Inyección de dependencias
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private apiService = inject(ApiService);
  private reservaService = inject(ReservaService);
  private cdr = inject(ChangeDetectorRef);
  private stripeService = inject(StripeService);

  /** ID del espacio que se está reservando, obtenido del parámetro de ruta */
  espacioId: string | null = null;
  /** Datos completos del espacio obtenidos de la API */
  espacio: any = null;
  isLoading: boolean = true;
  errorMessage: string | null = null;

  // ========================
  // DATOS DEL FORMULARIO DE RESERVA
  // ========================

  /** Fecha y hora de inicio seleccionadas (formato ISO: YYYY-MM-DDTHH:mm) */
  fechaInicio: string = '';
  /** Fecha y hora de fin seleccionadas (formato ISO: YYYY-MM-DDTHH:mm) */
  fechaFin: string = '';

  // Valores calculados del precio
  /** Precio total final (base + comisión) */
  totalPrice: number = 0;
  /** Número de días de la reserva */
  days: number = 0;
  /** Precio base sin comisión (precio_hora × días) */
  basePrice: number = 0;
  /** Importe de la comisión de la plataforma */
  commissionAmount: number = 0;
  /** Tasa de comisión: 14.59% por gastos de gestión */
  private readonly COMMISSION_RATE = 0.1459;

  // ========================
  // DATOS DEL CALENDARIO VISUAL
  // ========================

  /** Nombre del mes actual mostrado en el calendario (ej: "Febrero 2026") */
  currentMonthName: string = '';
  /** Abreviaturas de los días de la semana en español */
  weekDays = ['Do', 'Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa'];
  /** Matriz de semanas del mes para renderizar la cuadrícula del calendario */
  calendarDays: any[][] = [];

  /** Fecha de referencia para el mes actualmente mostrado en el calendario */
  currentDate = new Date();
  /** Fecha de inicio seleccionada por el usuario en el calendario */
  selectedStartDate: Date | null = null;
  /** Fecha de fin seleccionada por el usuario en el calendario */
  selectedEndDate: Date | null = null;

  // ========================
  // DISPONIBILIDAD
  // ========================

  /** Conjunto de fechas no disponibles en formato 'YYYY-MM-DD' */
  unavailableDates: Set<string> = new Set();
  /** Capacidad máxima del espacio (para control de aforo) */
  capacidad: number = 0;
  /** Mensaje de advertencia si hay conflicto de disponibilidad */
  availabilityWarning: string | null = null;

  // ========================
  // INTEGRACIÓN CON STRIPE
  // ========================

  /** Indica si se muestra la sección de pago con Stripe */
  showPayment: boolean = false;
  /** Indica si se está procesando un pago */
  isProcessingPayment: boolean = false;
  /** Instancia de Stripe Elements para el formulario de pago */
  elements: StripeElements | undefined;
  /** Objeto Payment Request de Stripe (para Apple Pay / Google Pay) */
  paymentRequest: any;

  /**
   * Inicializa el componente:
   * 1. Genera el calendario del mes actual.
   * 2. Obtiene el ID del espacio del parámetro de ruta.
   * 3. Carga los datos del espacio y su disponibilidad.
   * 4. Configura un timeout de 15 segundos para prevenir cargas infinitas.
   */
  ngOnInit() {
    try {
      console.log('ReservaComponent: Initializing...');
      this.generateCalendar();
      console.log('ReservaComponent: Calendar generated');

      this.route.paramMap.subscribe({
        next: (params) => {
          this.espacioId = params.get('id');
          console.log('ReservaComponent: ID received:', this.espacioId);

          if (this.espacioId) {
            this.loadEspacio(this.espacioId);
          } else {
            console.error('ReservaComponent: Invalid ID');
            this.errorMessage = 'ID de espacio no válido';
            this.isLoading = false;
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error('ReservaComponent: Route param error', err);
          this.errorMessage = 'Error al obtener parámetros de ruta';
          this.isLoading = false;
          this.cdr.detectChanges();
        }
      });

      // Timeout de seguridad: si la carga tarda más de 15 segundos, se muestra un error
      setTimeout(() => {
        if (this.isLoading) {
          console.warn('ReservaComponent: Timeout triggered');
          this.isLoading = false;
          if (!this.espacio) {
            this.errorMessage = 'La carga está tardando demasiado. Verifica tu conexión o intenta recargar.';
          }
          this.cdr.detectChanges();
        }
      }, 15000);
    } catch (e: any) {
      console.error('ReservaComponent: Critical Init Error', e);
      this.errorMessage = 'Error de inicialización: ' + e.message;
      this.isLoading = false;
      this.cdr.detectChanges();
    }
  }

  // ========================
  // MÉTODOS DEL CALENDARIO
  // ========================

  /**
   * Genera la cuadrícula del calendario para el mes actual.
   * Crea una matriz de semanas donde cada celda es una fecha o null
   * (para los slots vacíos al inicio del mes).
   */
  generateCalendar() {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();

    // Se genera el nombre del mes localizado en español con la primera letra en mayúsculas
    this.currentMonthName = this.currentDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    this.currentMonthName = this.currentMonthName.charAt(0).toUpperCase() + this.currentMonthName.slice(1);

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay(); // 0 = Domingo, 6 = Sábado

    let days: any[] = [];

    // Se añaden slots vacíos para los días del mes anterior
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }

    // Se generan los días del mes
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(new Date(year, month, i));
    }

    // Se agrupa en semanas de 7 días
    this.calendarDays = [];
    while (days.length > 0) {
      this.calendarDays.push(days.splice(0, 7));
    }
  }

  /** Navega al mes anterior y recarga la disponibilidad. */
  prevMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() - 1);
    this.generateCalendar();
    if (this.espacioId) this.loadDisponibilidad(this.espacioId);
  }

  /** Navega al mes siguiente y recarga la disponibilidad. */
  nextMonth() {
    this.currentDate.setMonth(this.currentDate.getMonth() + 1);
    this.generateCalendar();
    if (this.espacioId) this.loadDisponibilidad(this.espacioId);
  }

  /**
   * Maneja la selección de una fecha en el calendario.
   * Implementa un sistema de selección de rango:
   * - Primer clic: establece la fecha de inicio.
   * - Segundo clic: establece la fecha de fin (si es posterior al inicio).
   * - Tercer clic: reinicia el rango con la nueva fecha como inicio.
   * - Clic anterior al inicio: reinicia el rango.
   *
   * No permite seleccionar fechas marcadas como no disponibles.
   */
  selectDate(date: Date) {
    if (!date) return;
    if (this.isDateUnavailable(date)) return;

    if (this.selectedStartDate && this.selectedEndDate) {
      // Si ya hay un rango completo, se reinicia con la nueva fecha
      this.selectedStartDate = date;
      this.selectedEndDate = null;
    } else if (!this.selectedStartDate) {
      this.selectedStartDate = date;
    } else {
      // Si la fecha es anterior al inicio, se reinicia el rango
      if (date < this.selectedStartDate) {
        this.selectedStartDate = date;
        this.selectedEndDate = null;
      } else {
        this.selectedEndDate = date;
      }
    }

    this.updateFormAndPrice();
  }

  /**
   * Actualiza los campos del formulario y recalcula el precio
   * según las fechas seleccionadas en el calendario.
   * Establece hora por defecto: 09:00 para inicio y 18:00 para fin.
   */
  updateFormAndPrice() {
    if (this.selectedStartDate) {
      const y = this.selectedStartDate.getFullYear();
      const m = String(this.selectedStartDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedStartDate.getDate()).padStart(2, '0');
      this.fechaInicio = `${y}-${m}-${d}T09:00`; // Hora por defecto: 9:00 AM
    }

    if (this.selectedEndDate) {
      const y = this.selectedEndDate.getFullYear();
      const m = String(this.selectedEndDate.getMonth() + 1).padStart(2, '0');
      const d = String(this.selectedEndDate.getDate()).padStart(2, '0');
      this.fechaFin = `${y}-${m}-${d}T18:00`; // Hora por defecto: 6:00 PM

      this.calculatePrice();
    } else {
      this.fechaFin = '';
      this.totalPrice = 0;
      this.days = 0;
    }

    // Se oculta el formulario de pago si cambian las fechas
    this.showPayment = false;
    this.cdr.detectChanges();
  }

  /** Maneja cambios manuales en los inputs de fecha. */
  onDateChange() {
    if (this.fechaInicio) this.selectedStartDate = new Date(this.fechaInicio);
    if (this.fechaFin) this.selectedEndDate = new Date(this.fechaFin);
    this.calculatePrice();
    this.showPayment = false;
  }

  /**
   * Calcula el precio total de la reserva.
   * Precio total = (precio_hora × días) + comisión del 14.59%.
   * Se garantiza un mínimo de 1 día.
   */
  calculatePrice() {
    if (this.selectedStartDate && this.selectedEndDate && this.espacio) {
      const diffTime = Math.abs(this.selectedEndDate.getTime() - this.selectedStartDate.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      this.days = diffDays > 0 ? diffDays : 1;

      this.basePrice = this.days * this.espacio.precio_hora;
      this.commissionAmount = this.basePrice * this.COMMISSION_RATE;
      this.totalPrice = this.basePrice + this.commissionAmount;
    }
  }

  // ========================
  // MÉTODOS AUXILIARES DEL CALENDARIO
  // ========================

  /** Comprueba si una fecha está seleccionada como inicio o fin del rango. */
  isDateSelected(date: Date): boolean {
    if (!date || !this.selectedStartDate) return false;

    const isStart = this.isSameDay(date, this.selectedStartDate);
    const isEnd = this.selectedEndDate ? this.isSameDay(date, this.selectedEndDate) : false;

    return isStart || isEnd;
  }

  /** Comprueba si una fecha está dentro del rango seleccionado (excluyendo inicio y fin). */
  isDateInRange(date: Date): boolean {
    if (!date || !this.selectedStartDate || !this.selectedEndDate) return false;

    // Se normalizan a medianoche para comparación de rango correcta
    const d = new Date(date).setHours(0, 0, 0, 0);
    const start = new Date(this.selectedStartDate).setHours(0, 0, 0, 0);
    const end = new Date(this.selectedEndDate).setHours(0, 0, 0, 0);

    return d > start && d < end;
  }

  /** Compara si dos fechas son el mismo día (ignorando la hora). */
  private isSameDay(d1: Date, d2: Date): boolean {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  }

  // ========================
  // CARGA DE DATOS
  // ========================

  /** Carga los datos del espacio desde la API y luego carga su disponibilidad. */
  loadEspacio(id: string) {
    this.isLoading = true;
    this.errorMessage = null;
    this.cdr.detectChanges();

    this.apiService.getEspacioById(id).subscribe({
      next: (data: any) => {
        console.log('API Response:', data);
        if (data) {
          this.espacio = data;
          this.capacidad = data.capacidad || 1;
          // Se carga la disponibilidad del mes actualmente visible
          this.loadDisponibilidad(id);
        } else {
          this.errorMessage = 'No se encontraron datos para este espacio';
        }
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('API Error:', err);
        this.errorMessage = 'Error al cargar el espacio. ' + (err.message || '');
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Carga los días no disponibles del mes visible del calendario.
   * La API devuelve un array de fechas ocupadas (dias_ocupados) en formato 'YYYY-MM-DD'.
   */
  loadDisponibilidad(id: string) {
    const year = this.currentDate.getFullYear();
    const month = String(this.currentDate.getMonth() + 1).padStart(2, '0');
    const mes = `${year}-${month}`;

    this.apiService.get(`/espacios/${id}/disponibilidad?mes=${mes}`).subscribe({
      next: (data: any) => {
        this.unavailableDates = new Set(data.dias_ocupados || []);
        this.capacidad = data.capacidad || 1;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error cargando disponibilidad:', err);
      }
    });
  }

  /** Comprueba si un día está marcado como no disponible (ocupado). */
  isDateUnavailable(date: Date): boolean {
    if (!date) return false;
    const dateStr = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
    return this.unavailableDates.has(dateStr);
  }

  /** Comprueba si un día es anterior al día actual (fecha pasada). */
  isDatePast(date: Date): boolean {
    if (!date) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d < today;
  }

  // ========================
  // FLUJO DE PAGO CON STRIPE (3 PASOS)
  // ========================

  /**
   * **Paso 1**: Inicia el proceso de reserva y pago.
   * - Crea una reserva pendiente en el backend.
   * - Obtiene el clientSecret de Stripe para el PaymentIntent.
   * - Configura Stripe Elements (formulario de tarjeta + Apple Pay/Google Pay).
   * - Si hay conflicto de disponibilidad (409), muestra advertencia y recarga el calendario.
   */
  iniciarProcesoReserva() {
    if (!this.espacioId || !this.fechaInicio || !this.fechaFin) {
      alert('Por favor selecciona las fechas en el calendario');
      return;
    }

    const payload = {
      id_espacio: this.espacioId,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

    this.isLoading = true;
    this.cdr.detectChanges();
    this.reservaService.initiatePayment(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        console.log('Reserva creada (pendiente), iniciando pago', res);

        if (res.clientSecret) {
          this.showPayment = true;
          this.cdr.detectChanges();

          // Se configura el Payment Request para Apple Pay / Google Pay
          const amount = Math.round(res.details.monto_total * 100); // Stripe usa céntimos
          const prOptions = {
            country: 'ES',
            currency: 'eur',
            total: {
              label: 'Reserva Total',
              amount: amount
            },
            requestPayerName: true,
            requestPayerEmail: true
          };

          const pr = this.stripeService.paymentRequest(prOptions);
          this.paymentRequest = pr;

          // Se verifica si Apple Pay / Google Pay están disponibles
          pr.canMakePayment().then((result: any) => {
            const walletAvailable = !!result;

            if (walletAvailable) {
              // Manejo del pago mediante wallet (Apple Pay / Google Pay)
              pr.on('paymentmethod', (ev: any) => {
                this.stripeService.confirmCardPayment(res.clientSecret, {
                  payment_method: ev.paymentMethod.id
                }).subscribe(confirmResult => {
                  if (confirmResult.error) {
                    ev.complete('fail');
                    alert('Error en pago con Wallet: ' + confirmResult.error.message);
                  } else {
                    ev.complete('success');
                    if (confirmResult.paymentIntent && confirmResult.paymentIntent.status === 'succeeded') {
                      this.finalizarReservaEnBD(confirmResult.paymentIntent.id);
                    }
                  }
                });
              });
            }

            // Se inicializan los Stripe Elements estándar (siempre disponibles)
            this.stripeService.elements({
              clientSecret: res.clientSecret,
              appearance: { theme: 'stripe' },
              locale: 'es'
            }).subscribe(elements => {
              this.elements = elements;

              // Se monta el formulario de pago estándar (tarjeta de crédito/débito)
              const paymentElement = this.elements.create('payment', {
                layout: 'tabs'
              });
              paymentElement.mount('#payment-element');

              // Se monta el botón de wallet si está disponible
              if (walletAvailable) {
                const prButton = this.elements.create('paymentRequestButton', {
                  paymentRequest: pr
                });
                prButton.mount('#payment-request-button');
              }
            });
          });

        } else {
          // Caso de reserva gratuita (sin pago necesario)
          alert('Reserva gratuita detectada.');
        }
      },
      error: (err) => {
        console.error('Error detallado:', err);
        this.isLoading = false;

        // Error 409: Conflicto de disponibilidad (fechas ya ocupadas)
        if (err.status === 409 && err.error?.message) {
          this.availabilityWarning = err.error.message;
          // Se recarga la disponibilidad para actualizar las fechas ocupadas del calendario
          if (this.espacioId) this.loadDisponibilidad(this.espacioId);
        } else {
          let errorDetails = '';
          if (err.error && typeof err.error === 'object') {
            errorDetails = err.error.message || JSON.stringify(err.error, null, 2);
          } else {
            errorDetails = JSON.stringify(err, null, 2);
          }
          alert('Error al iniciar pago: ' + errorDetails);
        }

        this.cdr.detectChanges();
      }
    });
  }

  /**
   * **Paso 2**: Confirma el pago en Stripe.
   * Usa confirmPayment con redirect: 'if_required' para evitar la redirección
   * y manejar el resultado del pago directamente en la aplicación.
   * Si el pago es exitoso, pasa al Paso 3 (guardar reserva en BD).
   */
  realizarPago() {
    if (this.isProcessingPayment || !this.elements) return;
    this.isProcessingPayment = true;

    this.stripeService.confirmPayment({
      elements: this.elements,
      confirmParams: {
        return_url: window.location.origin,
        payment_method_data: {}
      },
      redirect: 'if_required'
    }).subscribe({
      next: (result) => {
        if (result.error) {
          this.isProcessingPayment = false;
          console.error('Error pago:', result.error);
          alert('Error en el pago: ' + result.error.message);
        } else if (result.paymentIntent && result.paymentIntent.status === 'succeeded') {
          // Pago exitoso: se procede a guardar la reserva en el backend
          this.finalizarReservaEnBD(result.paymentIntent.id);
        }
      },
      error: (err) => {
        this.isProcessingPayment = false;
        console.error('Error sistema pago:', err);
        alert('Error al procesar el pago');
      }
    });
  }

  /**
   * **Paso 3**: Guarda la reserva confirmada en el backend.
   * Envía el ID del PaymentIntent de Stripe junto con los datos de la reserva
   * para vincular el pago con la reserva en la base de datos.
   * Tras el éxito, redirige al panel del cliente.
   *
   * Si falla, se muestra información detallada del error incluyendo
   * el ID del pago Stripe como referencia para soporte.
   */
  finalizarReservaEnBD(paymentIntentId: string) {
    const payload = {
      payment_intent_id: paymentIntentId,
      id_espacio: this.espacioId,
      fecha_inicio: this.fechaInicio,
      fecha_fin: this.fechaFin
    };

    this.reservaService.crearReserva(payload).subscribe({
      next: (res) => {
        this.isProcessingPayment = false;
        alert('¡Pago exitoso y Reserva confirmada!');
        this.router.navigate(['/cliente/panel']);
      },
      error: (err) => {
        this.isProcessingPayment = false;
        console.error('Error al guardar reserva post-pago:', err);

        // Se construye un mensaje detallado de error para facilitar el soporte
        let detailedMsg = 'Pago realizado pero hubo un error al guardar la reserva.';
        if (err.error && err.error.message) {
          detailedMsg += '\nCausa: ' + err.error.message;
        }
        if (err.error && err.error.debug) {
          detailedMsg += '\nDetalle: ' + err.error.debug;
        }

        // Se incluye el ID del pago Stripe como referencia para resoluciones manuales
        alert(detailedMsg + '\n\nID de pago (Stripe): ' + paymentIntentId);
      }
    });
  }
}
