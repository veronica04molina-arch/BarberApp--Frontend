import { Routes } from '@angular/router';
import { CrearUsuario } from './features/auth/pages/crear-usuario/crear-usuario';

export const routes: Routes = [

  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/pages/login/login')
        .then(m => m.LoginComponent)
  },

  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },

  {
  path: 'cliente/dashboard',
  loadComponent: () =>
    import('./features/cliente/pages/dashboard/dashboard')
      .then(m => m.DashboardComponent)
},
  {
    path: 'crear-usuario',
    component: CrearUsuario
  }
];
