import { computed, Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';

import { LoginRequest } from '../../models/login-request';
import { LoginResponse } from '../../models/login-response';
import { environment } from '../../../environments/environment';
import { END_POINT_SERVICE } from '../../../environments/environment.variable';

type UsuarioSesion = Pick<LoginResponse, 'id' | 'nombre' | 'email' | 'rol'>;

export interface CambiarPasswordRequest {
  password: string;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  private readonly loginUrl = `${environment.apiUrl}`;

  readonly usuario = signal<UsuarioSesion | null>(this.restaurarUsuario());

  readonly primerNombre = computed(() => this.usuario()?.nombre.trim().split(/\s+/)[0] ?? '');

  readonly iniciales = computed(() => {
    const palabras = this.usuario()?.nombre.trim().split(/\s+/).filter(Boolean) ?? [];

    if (palabras.length === 0) return '';

    if (palabras.length === 1) {
      return palabras[0].slice(0, 2).toUpperCase();
    }

    return `${palabras[0][0]}${palabras[palabras.length - 1][0]}`.toUpperCase();
  });

  readonly rutaInicio = computed(() => {
    const rol = this.usuario()?.rol.toLowerCase();

    if (rol === 'cliente') return '/cliente/dashboard';
    if (rol === 'barbero') return '/barbero/dashboard';

    return '/login';
  });

  // ==========================================
  // LOGIN / SESIÓN
  // ==========================================

  iniciarSesion(credenciales: LoginRequest): Observable<LoginResponse> {
    return this.http
      .post<LoginResponse>(`${this.loginUrl}/${END_POINT_SERVICE.POST_AUTH_USER}`, credenciales)
      .pipe(tap((response) => this.establecerSesion(response)));
  }

  establecerSesion(response: LoginResponse): void {
    localStorage.setItem('token', response.token);

    const usuario: UsuarioSesion = {
      id: response.id,
      nombre: response.nombre,
      email: response.email,
      rol: response.rol,
    };

    localStorage.setItem('usuario', JSON.stringify(usuario));

    this.usuario.set(usuario);
  }

  cerrarSesion(): void {
    const token = localStorage.getItem('token');

    // Si por alguna razón no existe token,
    // simplemente limpiamos la sesión local.
    if (!token) {
      this.limpiarSesionLocal();
      return;
    }

    this.http
      .post(`${this.loginUrl}/${END_POINT_SERVICE.POST_AUTH_LOGOUT}`, null, {
        responseType: 'text',
      })
      .subscribe({
        next: (respuesta) => {
          console.log('Logout backend:', respuesta);

          this.limpiarSesionLocal();
        },

        error: (error) => {
          console.error('Error al cerrar sesión en el backend:', error);

          // Aunque el backend falle, limpiamos
          // la sesión local para no dejar al usuario
          // aparentemente conectado.
          this.limpiarSesionLocal();
        },
      });
  }

  private limpiarSesionLocal(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');

    this.usuario.set(null);

    this.router.navigate(['/login']);
  }

  cerrarSesionLocal(): void {
    this.limpiarSesionLocal();
  }

  estaAutenticado(): boolean {
    return !!localStorage.getItem('token');
  }

  obtenerUsuario(): UsuarioSesion | null {
    return this.usuario();
  }

  private restaurarUsuario(): UsuarioSesion | null {
    if (!localStorage.getItem('token')) {
      return null;
    }

    const usuarioGuardado = localStorage.getItem('usuario');

    if (!usuarioGuardado) {
      return null;
    }

    try {
      const usuario = JSON.parse(usuarioGuardado) as UsuarioSesion;

      if (!usuario || typeof usuario.nombre !== 'string' || typeof usuario.rol !== 'string') {
        return null;
      }

      return usuario;
    } catch {
      return null;
    }
  }

  // ==========================================
  // PERFIL
  // ==========================================

  cambiarPassword(datos: CambiarPasswordRequest): Observable<void> {
    return this.http.put<void>(`${this.loginUrl}/${END_POINT_SERVICE.PUT_CAMBIAR_PASSWORD}`, datos);
  }

  // ==========================================
  // RECUPERACIÓN DE CONTRASEÑA
  // ==========================================

  solicitarRecuperacionPassword(email: string): Observable<void> {
    return this.http.post<void>(`${this.loginUrl}/${END_POINT_SERVICE.POST_OLVIDE_PASSWORD}`, {
      email,
    });
  }

  restablecerPassword(datos: {
    email: string;
    token: string;
    nuevaPassword: string;
  }): Observable<void> {
    return this.http.post<void>(
      `${this.loginUrl}/${END_POINT_SERVICE.POST_RESTABLECER_PASSWORD}`,
      datos,
    );
  }
}
