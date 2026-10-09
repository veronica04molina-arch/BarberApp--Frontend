import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';
import { inject } from '@angular/core';

import { AuthService } from '../services/AuthService';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  const token = localStorage.getItem('token');

  const esRutaGooglePublica =
    req.url.includes(END_POINT_SERVICE.POST_AUTH_GOOGLE_VERIFY) ||
    req.url.includes(END_POINT_SERVICE.POST_AUTH_GOOGLE_REGISTER);

  const esRutaLogout = req.url.includes(END_POINT_SERVICE.POST_AUTH_LOGOUT);

  let request = req;

  // El logout SÍ necesita llevar el JWT.
  // Las rutas de Google no lo necesitan.
  if (token && !esRutaGooglePublica) {
    request = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      // Si una ruta protegida devuelve 401,
      // se cierra la sesión automáticamente.
      //
      // EXCEPTO el propio logout, porque esa petición
      // ya está intentando cerrar la sesión.
      if (error.status === 401 && !esRutaGooglePublica && !esRutaLogout) {
        authService.cerrarSesion();
      }

      return throwError(() => error);
    }),
  );
};
