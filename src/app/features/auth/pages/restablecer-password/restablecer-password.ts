import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/AuthService'; // Ajusta la ruta a tu servicio
import { LucideEye, LucideEyeOff, LucideLockKeyhole } from '@lucide/angular';

@Component({
  selector: 'app-restablecer-password',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideLockKeyhole, LucideEye, LucideEyeOff],
  templateUrl: './restablecer-password.html',
  styleUrl: './restablecer-password.css',
})
export class RestablecerPassword implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);

  // Datos de la URL
  token = signal('');
  email = signal('');

  // Formulario
  nuevaPassword = signal('');
  confirmarPassword = signal('');

  // Estados de UI
  mostrarPassword = signal(false);
  mostrarConfirmarPassword = signal(false);
  cargando = signal(false);
  errorGeneral = signal('');
  mensajeExito = signal('');

  ngOnInit(): void {
    // Obtener token y email pasados por queryParams (?token=...&email=...)
    this.route.queryParams.subscribe((params) => {
      this.token.set(params['token'] || '');
      this.email.set(params['email'] || '');

      if (!this.token() || !this.email()) {
        this.errorGeneral.set('El enlace de recuperación es inválido o faltan parámetros.');
      }
    });
  }

  actualizarContrasena(): void {
    this.errorGeneral.set('');
    this.mensajeExito.set('');

    const password = this.nuevaPassword().trim();
    const confirmacion = this.confirmarPassword().trim();

    if (!password) {
      this.errorGeneral.set('Ingresa la nueva contraseña.');
      return;
    }

    if (password.length < 6) {
      this.errorGeneral.set('La contraseña debe tener al menos 6 caracteres.');
      return;
    }

    if (password !== confirmacion) {
      this.errorGeneral.set('Las contraseñas no coinciden.');
      return;
    }

    this.cargando.set(true);

    const datos = {
      email: this.email(),
      token: this.token(),
      nuevaPassword: password,
    };

    this.authService.restablecerPassword(datos).subscribe({
      next: () => {
        this.cargando.set(false);
        this.mensajeExito.set(
          '¡Tu contraseña ha sido actualizada exitosamente! Redirigiendo al inicio de sesión...',
        );

        setTimeout(() => {
          this.router.navigate(['/login']);
        }, 2500);
      },
      error: (err) => {
        this.cargando.set(false);
        const msg =
          err?.error?.error || err?.error || 'Ocurrió un error al restablecer la contraseña.';
        this.errorGeneral.set(msg);
      },
    });
  }
}
