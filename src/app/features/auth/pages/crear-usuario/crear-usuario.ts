import { Component, signal, AfterViewInit, ElementRef, ViewChild, inject } from '@angular/core';

import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { END_POINT_SERVICE } from '../../../../../environments/environment.variable';

import {
  AbstractControl,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  ValidationErrors,
  ValidatorFn,
  Validators,
} from '@angular/forms';

import {
  LucideEye,
  LucideEyeOff,
  LucideLockKeyhole,
  LucideMail,
  LucidePhone,
  LucideUser,
} from '@lucide/angular';

import { Router, RouterLink } from '@angular/router';
import { CommonModule } from '@angular/common';

import { CrearUsuarioService } from '../../../../core/services/CrearUsuarioService';
import { UsuarioRequest } from '../../../../models/usuario';

declare const google: any;

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdTokenPayload {
  aud?: string;
  iss?: string;
  exp?: number;
  email: string;
  name?: string;
}

interface GoogleVerificationResponse {
  nombre?: string;
  email?: string;
}

// Validar nombre completo
function nombreCompletoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const nombre = control.value?.trim();

    if (!nombre) {
      return null;
    }

    const partesNombre = nombre.split(/\s+/);

    return partesNombre.length >= 2 ? null : { nombreCompleto: true };
  };
}

// Validar formato de correo electrónico
function correoValidoValidator(): ValidatorFn {
  return (control: AbstractControl): ValidationErrors | null => {
    const email = control.value?.trim();

    if (!email) {
      return null;
    }

    const patron = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9-]+(\.[a-zA-Z0-9-]+)+$/;

    if (!patron.test(email)) {
      return { correoInvalido: true };
    }

    // Obtener la parte del dominio
    const dominio = email.split('@')[1];

    // Cada parte del dominio no puede superar 63 caracteres
    const partesDominio = dominio.split('.');

    if (partesDominio.some((parte: string) => parte.length > 63)) {
      return { correoInvalido: true };
    }

    // La extensión final debe tener entre 2 y 10 caracteres
    const extension = partesDominio[partesDominio.length - 1];

    if (extension.length < 2 || extension.length > 10) {
      return { correoInvalido: true };
    }

    return null;
  };
}

@Component({
  selector: 'app-crear-usuario',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    LucideUser,
    LucideMail,
    LucidePhone,
    LucideLockKeyhole,
    LucideEye,
    LucideEyeOff,
  ],
  templateUrl: './crear-usuario.html',
  styleUrl: './crear-usuario.css',
})
export class CrearUsuario implements AfterViewInit {
  registroForm: FormGroup;
  errorMessage = signal('');
  cuentaGoogleExiste = signal(false);
  cuentaCreada = signal(false);
  mostrarPassword = signal(false);

  @ViewChild('googleButton', { static: true })
  googleButton!: ElementRef<HTMLDivElement>;

  private readonly http = inject(HttpClient);
  private googleInitAttempts = 0;

  constructor(
    private fb: FormBuilder,
    private usuarioService: CrearUsuarioService,
    private router: Router,
  ) {
    this.registroForm = this.fb.group({
      // Nombre completo
      nombre: [
        '',
        [
          Validators.required,
          Validators.pattern(/^[\p{L} ]+$/u),
          Validators.minLength(3),
          Validators.maxLength(100),
          nombreCompletoValidator(),
        ],
      ],

      // Correo electrónico
      email: ['', [Validators.required, correoValidoValidator()]],

      // Teléfono
      telefono: ['', [Validators.required, Validators.pattern(/^3\d{9}$/)]],

      // Contraseña
      password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(20)]],

      // Términos y condiciones
      terminos: [false, [Validators.requiredTrue]],
    });
  }

  ngAfterViewInit(): void {
    this.inicializarGoogle();
  }

  private inicializarGoogle(): void {
    if (typeof google === 'undefined' || !google.accounts?.id) {
      if (this.googleInitAttempts < 40) {
        this.googleInitAttempts += 1;
        window.setTimeout(() => this.inicializarGoogle(), 100);
      } else {
        this.errorMessage.set('No se pudo cargar el acceso con Google. Recarga la página e intenta de nuevo.');
      }
      return;
    }

    google.accounts.id.initialize({
      client_id: environment.googleClientId,
      callback: (response: GoogleCredentialResponse) => this.verificarGoogle(response.credential),
    });

    google.accounts.id.renderButton(this.googleButton.nativeElement, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      text: 'continue_with',
      shape: 'circle',
      width: 400,
      locale: 'es',
    });
  }

  private verificarGoogle(credential: string): void {
    this.errorMessage.set('');
    this.cuentaGoogleExiste.set(false);

    try {
      if (!credential || credential.split('.').length !== 3) {
        throw new Error('Credencial de Google inválida.');
      }

      this.http
        .post<GoogleVerificationResponse>(
          `${environment.apiUrl}/${END_POINT_SERVICE.POST_AUTH_GOOGLE_VERIFY}`,
          { token: credential },
        )
        .subscribe({
          next: (response) => {
            try {
              const payload = this.leerDatosToken(credential);
              const email = response?.email ?? payload.email;
              const nombre = response?.nombre ?? payload.name ?? email;

              if (!email) {
                throw new Error('El backend no devolvió un correo válido.');
              }

              sessionStorage.setItem('google_token', credential);
              sessionStorage.setItem('google_nombre', nombre);
              sessionStorage.setItem('google_email', email);
              void this.router.navigate(['/registro-google']);
            } catch {
              this.errorMessage.set('No se pudieron obtener los datos de la cuenta de Google.');
            }
          },
          error: (error: HttpErrorResponse) => {
            if (error.status === 409) {
              this.cuentaGoogleExiste.set(true);
              this.errorMessage.set('');
              this.errorMessage.set('Ya existe una cuenta registrada con ese correo. Inicia sesión.');
            } else if (error.status === 400 || error.status === 401) {
              this.errorMessage.set('Google no pudo verificar la cuenta. Intenta de nuevo.');
            } else {
              this.errorMessage.set('No se pudo verificar la cuenta. Intenta de nuevo más tarde.');
            }
          },
        });
    } catch {
      this.errorMessage.set('La credencial de Google no es válida. Intenta de nuevo.');
    }
  }

  private leerDatosToken(credential: string): GoogleIdTokenPayload {
    const encodedPayload = credential.split('.')[1];
    const base64 = encodedPayload.replace(/-/g, '+').replace(/_/g, '/');
    const paddedBase64 = base64.padEnd(Math.ceil(base64.length / 4) * 4, '=');
    const bytes = Uint8Array.from(atob(paddedBase64), (character) => character.charCodeAt(0));
    return JSON.parse(new TextDecoder().decode(bytes)) as GoogleIdTokenPayload;
  }

  onSubmit() {
    // Validar campos del formulario
    if (this.registroForm.invalid) {
      this.registroForm.markAllAsTouched();
      return;
    }

    // No enviar los términos al backend
    const { terminos, ...formValues } = this.registroForm.value;

    const usuarioRequest: UsuarioRequest = {
      ...formValues,
    };

    // Registrar usuario
    this.usuarioService.registrarUsuario(usuarioRequest).subscribe({
      // Registro exitoso
      next: (response) => {
        this.cuentaCreada.set(true);
        this.errorMessage.set('');

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 3000);
      },
      error: (err) => {
        console.error('Error del servidor:', err);

        if (err.status === 409) {
          this.errorMessage.set('El correo electrónico ya está registrado.');
        } else if (err.status === 400) {
          this.errorMessage.set(err.error || 'Verifica los datos ingresados.');
        } else {
          this.errorMessage.set('No se pudo conectar con el servidor.');
        }
      },
    });
  }
}
