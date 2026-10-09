import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

import { AuthService } from '../services/AuthService';

export const authGuard: CanActivateFn = (route) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // No hay sesión
  if (!authService.estaAutenticado()) {
    return router.createUrlTree(['/login']);
  }

  // Obtener usuario actual
  const usuario = authService.obtenerUsuario();

  // No se pudieron obtener los datos del usuario
  if (!usuario) {
    authService.cerrarSesion();
    return router.createUrlTree(['/login']);
  }

  const rolUsuario = usuario.rol?.toLowerCase();
  const rolPermitido = route.data['rolPermitido']?.toLowerCase();

  // Si la ruta no exige un rol específico
  if (!rolPermitido) {
    return true;
  }

  // El rol coincide con el permitido
  if (rolUsuario === rolPermitido) {
    return true;
  }

  // El usuario está autenticado pero intenta entrar a una ruta
  // que no corresponde a su rol
  if (rolUsuario === 'cliente') {
    return router.createUrlTree(['/cliente/dashboard']);
  }

  if (rolUsuario === 'barbero') {
    return router.createUrlTree(['/barbero/dashboard']);
  }

  // Rol desconocido
  authService.cerrarSesion();
  return router.createUrlTree(['/login']);
};
