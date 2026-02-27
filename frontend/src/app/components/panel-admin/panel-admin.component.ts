import { Component, inject, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';

import { SidebarAdminComponent } from '../sidebar-admin/sidebar-admin.component';
import { AdminService } from '../../services/admin.service';
import { RouterLink } from '@angular/router';
import { TranslateModule, TranslateService } from '@ngx-translate/core';

/**
 * Componente del Panel de Administración (Dashboard).
 *
 * Este componente es la vista principal del panel de administración de CoSpace.
 * Se encarga de cargar y mostrar las estadísticas generales de la plataforma,
 * las reservas más recientes y los espacios más populares.
 *
 * Implementa un sistema de polling (consulta periódica) cada 10 segundos
 * para mantener los datos actualizados en tiempo real sin necesidad de
 * recargar la página manualmente.
 */
@Component({
    selector: 'app-panel-admin',
    standalone: true,
    imports: [SidebarAdminComponent, RouterLink, TranslateModule],
    templateUrl: './panel-admin.component.html',
})
export class PanelAdminComponent implements OnInit, OnDestroy {
    // Inyección del servicio de administración que se comunica con la API del backend
    private adminService = inject(AdminService);
    // Inyección del detector de cambios para forzar la actualización de la vista cuando sea necesario
    private cdr = inject(ChangeDetectorRef);
    private translate = inject(TranslateService);

    // Array que almacena las tarjetas de estadísticas del dashboard (usuarios, espacios, reservas, ingresos)
    stats: any[] = [];
    // Array que almacena las reservas más recientes para mostrar en la tabla del dashboard
    recentReservations: any[] = [];
    // Array que almacena los espacios más populares ordenados por número de reservas
    popularSpaces: any[] = [];

    // Indicador de estado de carga; se muestra un spinner mientras los datos se están obteniendo
    isLoading = true;
    // Mensaje de error que se muestra al usuario si falla la carga de datos
    errorMessage: string | null = null;

    // Referencia al intervalo de polling para poder limpiarlo al destruir el componente
    private pollingInterval: any = null;

    /**
     * Método del ciclo de vida que se ejecuta al inicializar el componente.
     * Realiza la carga inicial de los datos del dashboard y configura
     * un intervalo de polling cada 10 segundos para refrescar los datos
     * de forma automática y silenciosa (sin mostrar indicador de carga).
     */
    ngOnInit() {
        this.loadDashboardData();
        // Se configura un intervalo que refresca los datos cada 10 segundos para mantenerlos actualizados
        this.pollingInterval = setInterval(() => {
            this.refreshData();
        }, 10000);
    }

    /**
     * Método del ciclo de vida que se ejecuta al destruir el componente.
     * Limpia el intervalo de polling para evitar fugas de memoria
     * y peticiones innecesarias al backend cuando el usuario navega
     * a otra sección de la aplicación.
     */
    ngOnDestroy() {
        if (this.pollingInterval) {
            clearInterval(this.pollingInterval);
            this.pollingInterval = null;
        }
    }

    /**
     * Realiza la carga inicial de los datos del dashboard.
     * Activa el indicador de carga (isLoading) para que el usuario vea
     * un estado visual de que los datos se están obteniendo del servidor.
     * También limpia cualquier mensaje de error previo antes de la nueva carga.
     */
    loadDashboardData() {
        this.isLoading = true;
        this.errorMessage = null;
        this.fetchData();
    }

    /**
     * Realiza un refresco silencioso de los datos del dashboard.
     * A diferencia de loadDashboardData(), este método NO activa el indicador
     * de carga, de modo que la interfaz no parpadea ni muestra un spinner
     * durante las actualizaciones periódicas automáticas.
     */
    refreshData() {
        this.fetchData();
    }

    /**
     * Método privado que realiza la petición HTTP al backend para obtener
     * las estadísticas del dashboard.
     *
     * Al recibir la respuesta exitosa del servidor, transforma los datos
     * en un formato adecuado para las tarjetas de estadísticas, asignando
     * a cada una su título, valor, porcentaje de cambio, icono y color.
     *
     * En caso de error en la respuesta o en el procesamiento, se muestra
     * un mensaje de error descriptivo al usuario y se detiene el indicador de carga.
     *
     * Se utiliza ChangeDetectorRef.detectChanges() para forzar la actualización
     * de la vista, ya que las respuestas asíncronas fuera de la zona de Angular
     * podrían no ser detectadas automáticamente.
     */
    private fetchData() {
        this.adminService.getDashboardStats().subscribe({
            next: (data) => {
                try {
                    // Se construyen las tarjetas de estadísticas con los datos recibidos del servidor
                    this.stats = [
                        {
                            title: this.translate.instant('ADMIN.DASHBOARD.TOTAL_USERS'),
                            value: data.stats.usuarios.value,
                            change: data.stats.usuarios.change,
                            icon: 'users',
                            color: 'bg-blue-100 text-blue-600'
                        },
                        {
                            title: this.translate.instant('ADMIN.DASHBOARD.ACTIVE_SPACES'),
                            value: data.stats.espacios.value,
                            change: data.stats.espacios.change,
                            icon: 'office-building',
                            color: 'bg-orange-100 text-orange-600'
                        },
                        {
                            title: this.translate.instant('ADMIN.DASHBOARD.MONTH_BOOKINGS'),
                            value: data.stats.reservas.value,
                            change: data.stats.reservas.change,
                            icon: 'calendar',
                            color: 'bg-red-100 text-red-600'
                        },
                        {
                            title: this.translate.instant('ADMIN.DASHBOARD.MONTH_REVENUE'),
                            value: data.stats.ingresos.value,
                            change: data.stats.ingresos.change,
                            icon: 'currency-euro',
                            color: 'bg-green-100 text-green-600'
                        },
                    ];
                    // Se asignan las reservas recientes y los espacios populares recibidos del servidor
                    this.recentReservations = data.recentReservations;
                    this.popularSpaces = data.popularSpaces;

                    // Se desactiva el indicador de carga y se fuerza la detección de cambios en la vista
                    this.isLoading = false;
                    this.cdr.detectChanges();
                } catch (error) {
                    console.error('PanelAdminComponent: Error al procesar los datos del servidor', error);
                    this.errorMessage = this.translate.instant('ADMIN.DASHBOARD.ERROR');
                    this.isLoading = false;
                    this.cdr.detectChanges();
                }
            },
            error: (err) => {
                // Si la petición HTTP falla (error de red, servidor caído, etc.), se muestra un mensaje al usuario
                console.error('PanelAdminComponent: Error al cargar las estadísticas del dashboard', err);
                this.errorMessage = this.translate.instant('ADMIN.DASHBOARD.ERROR_FETCH');
                this.isLoading = false;
                this.cdr.detectChanges();
            }
        });
    }
}
