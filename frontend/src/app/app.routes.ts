import { Routes } from '@angular/router';
import { HomeComponent } from './components/home/home.component';
import { RegistroAnfitrionComponent } from './components/registro-anfitrion/registro-anfitrion.component';
import { RegistroClienteComponent } from './components/registro-cliente/registro-cliente.component';
import { CrearEspacioComponent } from './components/crear-espacio/crear-espacio.component';
import { MisAreasComponent } from './components/mis-areas/mis-areas.component';
import { LoginComponent } from './components/login/login.component';
import { EspaciosDetallesComponent } from './components/espacios-detalles/espacios-detalles.component';
import { ReservaComponent } from './components/reserva/reserva';
import { anfitrionGuard } from './guards/anfitrion.guard';
import { adminGuard } from './guards/admin.guard';
import { clienteGuard } from './guards/cliente.guard';
import { guestGuard } from './guards/guest.guard';

/**
 * Definición de todas las rutas de la aplicación CoSpace.
 *
 * Las rutas están organizadas en las siguientes secciones:
 * - Rutas públicas: página de inicio, registro, exploración y detalles de espacios.
 * - Rutas de anfitrión: crear/editar espacio, mis áreas, reservas recibidas (protegidas con anfitrionGuard).
 * - Rutas de administrador: panel de control, gestión de espacios, usuarios, reservas, reportes y pagos.
 * - Rutas de autenticación: login, verificación 2FA, recuperación y restablecimiento de contraseña.
 * - Ruta comodín (**): página 404 para URLs no encontradas.
 *
 * Las rutas de administrador y cliente usan carga perezosa (loadComponent) para optimizar
 * el rendimiento, cargando los componentes solo cuando el usuario navega a ellos.
 */
export const routes: Routes = [
    { path: '', component: HomeComponent, title: 'CoSpace - Inicio' },
    { path: 'registro-anfitrion', component: RegistroAnfitrionComponent, canActivate: [guestGuard], title: 'CoSpace - Registro Anfitrión' },
    { path: 'registro-cliente', component: RegistroClienteComponent, canActivate: [guestGuard], title: 'CoSpace - Registro Cliente' },
    { path: 'explorar', loadComponent: () => import('./components/explorar/explorar.component').then(m => m.ExplorarComponent), title: 'CoSpace - Explorar' },
    { path: 'espacios/:id', component: EspaciosDetallesComponent, title: 'CoSpace - Detalles del Espacio' },
    { path: 'reserva/:id', component: ReservaComponent, canActivate: [clienteGuard], title: 'CoSpace - Reservar Espacio' },

    // Rutas de información pública
    {
        path: 'sobre-nosotros',
        loadComponent: () => import('./components/sobre-nosotros/sobre-nosotros.component').then(m => m.SobreNosotrosComponent),
        title: 'CoSpace - Sobre Nosotros'
    },
    {
        path: 'aviso-legal',
        loadComponent: () => import('./components/aviso-legal/aviso-legal.component').then(m => m.AvisoLegalComponent),
        title: 'CoSpace - Aviso Legal'
    },
    {
        path: 'contacto',
        loadComponent: () => import('./components/contacto/contacto.component').then(m => m.ContactoComponent),
        title: 'CoSpace - Contacto'
    },

    // Rutas del anfitrión (protegidas con anfitrionGuard que verifica el rol del usuario)
    // IMPORTANT: estas rutas fijas deben ir ANTES de 'anfitrion/:id' para que Angular
    // no las confunda como parámetros dinámicos de perfil
    {
        path: 'anfitrion/crear-espacio',
        component: CrearEspacioComponent,
        title: 'CoSpace - Añadir Nueva Área',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/editar-espacio/:id',
        component: CrearEspacioComponent,
        title: 'CoSpace - Editar Área',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/mis-areas',
        component: MisAreasComponent,
        title: 'CoSpace - Mis Áreas',
        canActivate: [anfitrionGuard]
    },
    {
        path: 'anfitrion/reservas',
        loadComponent: () => import('./components/reservas-anfitrion/reservas-anfitrion.component').then(m => m.ReservasAnfitrionComponent),
        title: 'CoSpace - Reservas Recibidas',
        canActivate: [anfitrionGuard]
    },

    // Ruta dinámica de perfil público del anfitrión — debe ir DESPUÉS de todas las rutas fijas
    { path: 'anfitrion/:id', loadComponent: () => import('./components/perfil-anfitrion/perfil-anfitrion').then(m => m.PerfilAnfitrion), title: 'CoSpace - Perfil Anfitrión' },
    {
        path: 'iniciar-sesion',
        component: LoginComponent,
        title: 'CoSpace - Iniciar Sesión',
        canActivate: [guestGuard]
    },
    {
        path: 'cliente/panel',
        loadComponent: () => import('./components/panel-cliente/panel-cliente.component').then(m => m.PanelClienteComponent),
        title: 'CoSpace - Mi Panel',
        canActivate: [clienteGuard]
    },
    {
        path: 'configuracion',
        loadComponent: () => import('./components/configuracion/configuracion.component').then(m => m.ConfiguracionComponent),
        title: 'CoSpace - Configuración'
    },

    // Rutas del panel de administración (carga perezosa para mejor rendimiento)
    {
        path: 'admin/panel',
        loadComponent: () => import('./components/panel-admin/panel-admin.component').then(m => m.PanelAdminComponent),
        title: 'CoSpace - Admin Dashboard',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/espacios',
        loadComponent: () => import('./components/espacios-admin/espacios-admin.component').then(m => m.EspaciosAdminComponent),
        title: 'CoSpace - Gestión de Espacios',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/editar-espacio/:id',
        loadComponent: () => import('./components/espacio-admin-edit/espacio-admin-edit.component').then(m => m.EspacioAdminEditComponent),
        title: 'CoSpace - Editar Espacio (Admin)',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/usuarios',
        loadComponent: () => import('./components/usuarios-admin/usuarios-admin.component').then(m => m.UsuariosAdminComponent),
        title: 'CoSpace - Gestión de Usuarios',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/editar-usuario/:id',
        loadComponent: () => import('./components/usuario-admin-edit/usuario-admin-edit.component').then(m => m.UsuarioAdminEditComponent),
        title: 'CoSpace - Editar Usuario (Admin)',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/reservas',
        loadComponent: () => import('./components/reservas-admin/reservas-admin.component').then(m => m.ReservasAdminComponent),
        title: 'CoSpace - Gestión de Reservas',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/editar-reserva/:id',
        loadComponent: () => import('./components/reserva-admin-edit/reserva-admin-edit.component').then(m => m.ReservaAdminEditComponent),
        title: 'CoSpace - Editar Reserva (Admin)',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/reportes',
        loadComponent: () => import('./components/reportes-admin/reportes-admin.component').then(m => m.ReportesAdminComponent),
        title: 'CoSpace - Gestión de Reportes',
        canActivate: [adminGuard]
    },
    {
        path: 'admin/pagos',
        loadComponent: () => import('./components/pagos-admin/pagos-admin.component').then(m => m.PagosAdminComponent),
        title: 'CoSpace - Gestión de Pagos',
        canActivate: [adminGuard]
    },

    // Rutas de autenticación avanzada (verificación 2FA y recuperación de contraseña)
    {
        path: 'verify-2fa',
        loadComponent: () => import('./components/verify-2fa/verify-2fa.component').then(m => m.Verify2faComponent),
        title: 'CoSpace - Verificación 2FA'
    },
    {
        path: 'forgot-password',
        loadComponent: () => import('./components/forgot-password/forgot-password.component').then(m => m.ForgotPasswordComponent),
        title: 'CoSpace - Recuperar Contraseña',
        canActivate: [guestGuard]
    },
    {
        path: 'reset-password',
        loadComponent: () => import('./components/reset-password/reset-password.component').then(m => m.ResetPasswordComponent),
        title: 'CoSpace - Resetear Contraseña',
        canActivate: [guestGuard]
    },

    // Ruta comodín: cualquier URL no definida redirige a la página de error 404
    {
        path: '**',
        loadComponent: () => import('./components/not-found/not-found.component').then(m => m.NotFoundComponent),
        title: 'CoSpace - Página no encontrada'
    }
];
