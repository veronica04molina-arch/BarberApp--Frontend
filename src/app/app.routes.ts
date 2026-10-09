import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { CrearUsuario } from './features/auth/pages/crear-usuario/crear-usuario';
import { RestablecerPassword } from './features/auth/pages/restablecer-password/restablecer-password';
import { MainLayout } from './shared/main-layout/main-layout';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/pages/login/login').then((m) => m.LoginComponent),
  },

  {
    path: 'privacidad',
    data: { tipo: 'privacidad' },
    loadComponent: () =>
      import('./features/legal/pagina-legal/pagina-legal').then((m) => m.PaginaLegal),
  },

  {
    path: 'terminos',
    data: { tipo: 'terminos' },
    loadComponent: () =>
      import('./features/legal/pagina-legal/pagina-legal').then((m) => m.PaginaLegal),
  },

  { path: 'restablecer-password', component: RestablecerPassword },

  {
    path: 'registro-google',
    loadComponent: () =>
      import('./features/auth/pages/registro-google/registro-google').then((m) => m.RegistroGoogle),
  },

  {
    path: 'crear-usuario',
    component: CrearUsuario,
  },

  {
    path: 'cliente',
    component: MainLayout,
    canActivate: [authGuard],
    data: { rolPermitido: 'cliente' },
    children: [
      {
        path: 'dashboard',
        loadComponent: () =>
          import('./features/cliente/pages/dashboard/dashboard').then((m) => m.DashboardComponent),
      },
      {
        path: 'servicios',
        loadComponent: () =>
          import('./features/cliente/pages/servicios/servicios').then((m) => m.ServiciosCliente),
      },
      {
        path: 'agendar-cita',
        loadComponent: () =>
          import('./features/cliente/pages/agendar-cita/agendar-cita').then((m) => m.AgendarCita),
      },
      {
        path: 'mis-citas',
        loadComponent: () =>
          import('./features/cliente/pages/mis-citas/mis-citas').then((m) => m.MisCitas),
      },
      {
        path: 'perfil',
        data: { rol: 'cliente' },
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },
    ],
  },
  {
    path: 'barbero',
    component: MainLayout,
    canActivate: [authGuard],
    data: { rolPermitido: 'barbero' },
    children: [
      { path: 'dashboard', redirectTo: 'barbero-dashboard', pathMatch: 'full' },
      {
        path: 'barbero-dashboard',
        loadComponent: () =>
          import('./features/barbero/pages/dashboard/barbero-dashboard').then(
            (m) => m.BarberoDashboard,
          ),
      },
      {
        path: 'agenda',
        loadComponent: () => import('./features/barbero/pages/agenda/agenda').then((m) => m.Agenda),
      },
      {
        path: 'horarios',
        loadComponent: () =>
          import('./features/barbero/pages/horarios/horarios').then((m) => m.Horarios),
      },
      {
        path: 'servicios-barbero',
        loadComponent: () =>
          import('./features/barbero/pages/servicios-barbero/servicios-barbero').then(
            (m) => m.ServiciosBarbero,
          ),
      },
      {
        path: 'reportes',
        loadComponent: () =>
          import('./features/barbero/pages/reportes/reportes').then((m) => m.Reportes),
      },
      {
        path: 'perfil',
        data: { rol: 'barbero' },
        loadComponent: () => import('./features/perfil/perfil').then((m) => m.Perfil),
      },
    ],
  },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
];
