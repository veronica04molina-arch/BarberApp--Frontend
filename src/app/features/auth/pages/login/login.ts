import { Component, inject, signal } from '@angular/core';
import { HttpErrorResponse } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/AuthService';
import { LoginRequest } from '../../../../models/login-request';
import { Router, RouterLink } from '@angular/router';
import { LucideEye, LucideEyeOff, LucideLockKeyhole, LucideMail, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideMail, LucideLockKeyhole, LucideEye, LucideEyeOff, LucideX],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  mostrarPassword = signal(false);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  credenciales: LoginRequest = {
    email: '',
    password: '',
  };

  // Signals del Login
  errorCorreo = signal('');
  errorPassword = signal('');
  errorGeneral = signal('');
  iniciandoSesion = signal(false);

  // Signals para Recuperar Contraseña
  mostrarModalRecuperar = signal(false);
  correoRecuperacion = signal('');
  errorModalCorreo = signal('');
  mensajeExitoModal = signal('');
  enviandoRecuperacion = signal(false);

  validarCorreoMientrasEscribe(): void {
    const email = this.credenciales.email.trim();
    if (!email) {
      this.errorCorreo.set('');
      return;
    }
    this.errorCorreo.set(this.esCorreoValido(email) ? '' : 'Ingresa un correo válido.');
    this.errorGeneral.set('');
  }

  iniciarSesion(): void {
    this.errorCorreo.set('');
    this.errorPassword.set('');
    this.errorGeneral.set('');

    const email = this.credenciales.email.trim();
    const password = this.credenciales.password.trim();

    if (!email) {
      this.errorCorreo.set('Ingresa tu correo electrónico.');
    } else if (!this.esCorreoValido(email)) {
      this.errorCorreo.set('Ingresa un correo válido.');
    }

    if (!password) {
      this.errorPassword.set('Ingresa tu contraseña.');
    } else if (password.length < 6) {
      this.errorPassword.set('La contraseña debe tener al menos 6 caracteres.');
    }

    if (this.errorCorreo() || this.errorPassword()) {
      return;
    }

    this.credenciales.email = email;
    this.credenciales.password = password;
    this.iniciandoSesion.set(true);

    this.authService.iniciarSesion(this.credenciales).subscribe({
      next: (response) => {
        const rol = response.rol.toLowerCase();
        setTimeout(() => {
          this.iniciandoSesion.set(false);
          if (rol === 'cliente') {
            this.router.navigate(['/cliente/dashboard']);
          } else if (rol === 'barbero') {
            this.router.navigate(['/barbero/dashboard']);
          }
        }, 1000);
      },
      error: () => {
        this.errorGeneral.set('Correo o contraseña incorrectos.');
        this.iniciandoSesion.set(false);
      },
    });
  }

  // METODOS DE RECUPERACIÓN DE CONTRASEÑA
  abrirModalRecuperar(event: Event): void {
    event.preventDefault();
    // Carga el correo precargado del login si existe
    this.correoRecuperacion.set(this.credenciales.email.trim());
    this.errorModalCorreo.set('');
    this.mensajeExitoModal.set('');
    this.mostrarModalRecuperar.set(true);
  }

  cerrarModalRecuperar(): void {
    this.mostrarModalRecuperar.set(false);
  }

  solicitarRecuperacion(): void {
    this.errorModalCorreo.set('');
    this.mensajeExitoModal.set('');
    const email = this.correoRecuperacion().trim();

    if (!email) {
      this.errorModalCorreo.set('Ingresa tu correo electrónico.');
      return;
    }

    if (!this.esCorreoValido(email)) {
      this.errorModalCorreo.set('Ingresa un correo válido.');
      return;
    }

    this.enviandoRecuperacion.set(true);

    this.authService.solicitarRecuperacionPassword(email).subscribe({
      next: () => {
        this.enviandoRecuperacion.set(false);
        this.mensajeExitoModal.set('Hemos enviado las instrucciones a tu correo electrónico.');
      },
      error: (error: HttpErrorResponse) => {
        this.enviandoRecuperacion.set(false);
        this.errorModalCorreo.set(this.obtenerMensajeErrorRecuperacion(error));
      }
    });
  }

  private obtenerMensajeErrorRecuperacion(error: HttpErrorResponse): string {
    const respuesta = error.error;

    if (typeof respuesta === 'string' && respuesta.trim()) {
      return respuesta;
    }

    if (respuesta && typeof respuesta === 'object') {
      const mensaje = respuesta.message ?? respuesta.error;

      if (typeof mensaje === 'string' && mensaje.trim()) {
        return mensaje;
      }
    }

    return 'Ocurrió un error al procesar la solicitud.';
  }

  private esCorreoValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
