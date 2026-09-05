import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

import { AuthService } from '../../services/auth';
import { LoginRequest } from '../../../../models/login-request';
import { Usuario } from '../../../../models/usuario';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, RouterLink],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class LoginComponent {

  private readonly authService = inject(AuthService);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  credenciales: LoginRequest = {
    email: '',
    password: ''
  };

  usuario: Usuario | null = null;

  errorCorreo = '';
  errorPassword = '';
  errorGeneral = '';

  iniciandoSesion = false;

  validarCorreoMientrasEscribe(): void {
    const email = this.credenciales.email.trim();

    // Un correo vacío solo se informa al intentar iniciar sesión.
    if (!email) {
      this.errorCorreo = '';
      return;
    }

    this.errorCorreo = this.esCorreoValido(email)
      ? ''
      : 'Ingresa un correo válido.';

    this.errorGeneral = '';
  }

  iniciarSesion(): void {

    // Limpiar mensajes anteriores
    this.errorCorreo = '';
    this.errorPassword = '';
    this.errorGeneral = '';

    const email = this.credenciales.email.trim();
    const password = this.credenciales.password.trim();

    // Validar correo
    if (!email) {
      this.errorCorreo = 'Ingresa tu correo electrónico.';
    } else if (!this.esCorreoValido(email)) {
      this.errorCorreo = 'Ingresa un correo válido.';
    }

    // Validar contraseña
    if (!password) {
      this.errorPassword = 'Ingresa tu contraseña.';
    } else if (password.length < 6) {
      this.errorPassword =
        'La contraseña debe tener al menos 6 caracteres.';
    }

    // Si hay errores, no iniciar sesión
    if (this.errorCorreo || this.errorPassword) {
      return;
    }

    // Actualizar valores limpios
    this.credenciales.email = email;
    this.credenciales.password = password;

    // Mostrar "Iniciando sesión..."
    this.iniciandoSesion = true;

    // Enviar al backend
    this.authService
      .iniciarSesion(this.credenciales)
      .subscribe({

        next: (usuario) => {

  console.log('Login exitoso:', usuario);

  this.usuario = usuario;

  // Redirigir al Dashboard Cliente
  this.router.navigate(['/cliente/dashboard']);
},

        error: (error) => {

          console.error('Error:', error);

          this.errorGeneral =
            'Correo o contraseña incorrectos.';

          // Terminar estado de carga
          this.iniciandoSesion = false;

          this.changeDetector.markForCheck();
        }

      });
  }

  // Método privado para validar el correo
  private esCorreoValido(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}
