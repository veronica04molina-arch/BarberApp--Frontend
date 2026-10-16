import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  LucideEye,
  LucideEyeOff,
  LucideLockKeyhole,
  LucideMail,
  LucidePhone,
  LucideUser,
} from '@lucide/angular';

import { environment } from '../../../../../environments/environment';
import { END_POINT_SERVICE } from '../../../../../environments/environment.variable';
import { AuthService } from '../../../../core/services/AuthService';
import { LoginResponse } from '../../../../models/login-response';

@Component({
  selector: 'app-registro-google',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    RouterLink,
    LucideUser,
    LucideMail,
    LucidePhone,
    LucideLockKeyhole,
    LucideEye,
    LucideEyeOff,
  ],
  templateUrl: './registro-google.html',
  styleUrl: './registro-google.css',
})
export class RegistroGoogle {
  private readonly fb = inject(FormBuilder);
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  readonly errorMessage = signal('');
  readonly enviando = signal(false);
  readonly mostrarPassword = signal(false);
  readonly cuentaGoogleExiste = signal(false);
  readonly idTokenFaltante = signal(false);
  readonly registroExitoso = signal(false);

  readonly nombre: string;
  readonly correo: string;
  readonly idToken: string;
  readonly registroForm: FormGroup;

  constructor() {
    this.idToken = sessionStorage.getItem('google_token') ?? '';
    this.nombre = sessionStorage.getItem('google_nombre') ?? '';
    this.correo = sessionStorage.getItem('google_email') ?? '';
    this.idTokenFaltante.set(!this.idToken);

    this.registroForm = this.fb.nonNullable.group({
      nombre: [{ value: this.nombre, disabled: true }],
      correo: [{ value: this.correo, disabled: true }],
      telefono: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      aceptaTerminos: [false, [Validators.requiredTrue]],
    });
  }

  registrar(telefonoAutocompletado = ''): void {
    this.errorMessage.set('');
    this.cuentaGoogleExiste.set(false);

    if (!this.idToken) {
      this.idTokenFaltante.set(true);
      return;
    }

    const telefonoControl = this.registroForm.controls['telefono'];
    const telefonoNormalizado = telefonoAutocompletado.replace(/\D/g, '').replace(/^57(?=3\d{9}$)/, '');
    if (telefonoNormalizado && telefonoControl.value !== telefonoNormalizado) {
      telefonoControl.setValue(telefonoNormalizado);
    }

    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    const { telefono, password } = this.registroForm.getRawValue();
    this.enviando.set(true);

    this.http
      .post<LoginResponse>(`${environment.apiUrl}/${END_POINT_SERVICE.POST_AUTH_GOOGLE_REGISTER}`, {
        token: this.idToken,
        telefono: telefono.trim(),
        password,
      })
      .subscribe({
        next: (response) => {
          this.authService.establecerSesion(response);
          this.limpiarDatosGoogle();
          this.enviando.set(false);
          this.registroExitoso.set(true);
          this.navegarSegunRol(response.rol);
        },
        error: (error: HttpErrorResponse) => {
          this.enviando.set(false);

          if (error.status === 409) {
            this.cuentaGoogleExiste.set(true);
          } else if (error.status === 400) {
            const mensaje = typeof error.error === 'string' ? error.error : '';
            if (mensaje.includes('Token de Google inválido')) {
              this.errorMessage.set(
                'La verificación de Google venció. Vuelve a elegir tu cuenta para continuar.',
              );
              this.idTokenFaltante.set(true);
            } else {
              this.errorMessage.set(mensaje || 'Verifica los datos ingresados.');
            }
          } else if (error.status === 401) {
            this.errorMessage.set(
              'La verificación de Google venció. Vuelve a elegir tu cuenta para continuar.',
            );
            this.idTokenFaltante.set(true);
          } else {
            this.errorMessage.set('No fue posible completar el registro. Intenta de nuevo.');
          }
        },
      });
  }

  private navegarSegunRol(rol: string): void {
    const rolNormalizado = rol.toLowerCase();

    if (rolNormalizado === 'cliente') {
      void this.router.navigate(['/cliente/dashboard']);
    } else if (rolNormalizado === 'barbero') {
      void this.router.navigate(['/barbero/dashboard']);
    } else {
      this.errorMessage.set('Tu cuenta tiene un rol no reconocido.');
    }
  }

  private limpiarDatosGoogle(): void {
    sessionStorage.removeItem('google_token');
    sessionStorage.removeItem('google_nombre');
    sessionStorage.removeItem('google_email');
  }
}
